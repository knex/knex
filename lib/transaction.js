'use strict';

exports.__esModule = true;

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _uniqueId2 = require('lodash/uniqueId');

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _makeKnex = require('./util/make-knex');

var _makeKnex2 = _interopRequireDefault(_makeKnex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Transaction
// -------
var debug = (0, _debug2.default)('knex:tx');

// Acts as a facade for a Promise, keeping the internal state
// and managing any child transactions.
var Transaction = function (_EventEmitter) {
  (0, _inherits3.default)(Transaction, _EventEmitter);

  function Transaction(client, container, config, outerTx) {
    (0, _classCallCheck3.default)(this, Transaction);

    var _this = (0, _possibleConstructorReturn3.default)(this, _EventEmitter.call(this));

    var txid = _this.txid = (0, _uniqueId3.default)('trx');

    _this.client = client;
    _this.outerTx = outerTx;
    _this.trxClient = undefined;
    _this._debug = client.config && client.config.debug;

    debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level');

    _this._promise = _bluebird2.default.using(_this.acquireConnection(client, config, txid), function (connection) {

      var trxClient = _this.trxClient = makeTxClient(_this, client, connection);
      var init = client.transacting ? _this.savepoint(connection) : _this.begin(connection);

      init.then(function () {
        return makeTransactor(_this, connection, trxClient);
      }).then(function (transactor) {
        // If we've returned a "thenable" from the transaction container, assume
        // the rollback and commit are chained to this object's success / failure.
        // Directly thrown errors are treated as automatic rollbacks.
        var result = void 0;
        try {
          result = container(transactor);
        } catch (err) {
          result = _bluebird2.default.reject(err);
        }
        if (result && result.then && typeof result.then === 'function') {
          result.then(function (val) {
            return transactor.commit(val);
          }).catch(function (err) {
            return transactor.rollback(err);
          });
        }
        return null;
      }).catch(function (e) {
        return _this._rejecter(e);
      });

      return new _bluebird2.default(function (resolver, rejecter) {
        _this._resolver = resolver;
        _this._rejecter = rejecter;
      });
    });

    _this._completed = false;

    // If there's a wrapping transaction, we need to wait for any older sibling
    // transactions to settle (commit or rollback) before we can start, and we
    // need to register ourselves with the parent transaction so any younger
    // siblings can wait for us to complete before they can start.
    _this._previousSibling = _bluebird2.default.resolve(true);
    if (outerTx) {
      if (outerTx._lastChild) _this._previousSibling = outerTx._lastChild;
      outerTx._lastChild = _this._promise;
    }
    return _this;
  }

  Transaction.prototype.isCompleted = function isCompleted() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || false;
  };

  Transaction.prototype.begin = function begin(conn) {
    return this.query(conn, 'BEGIN;');
  };

  Transaction.prototype.savepoint = function savepoint(conn) {
    return this.query(conn, 'SAVEPOINT ' + this.txid + ';');
  };

  Transaction.prototype.commit = function commit(conn, value) {
    return this.query(conn, 'COMMIT;', 1, value);
  };

  Transaction.prototype.release = function release(conn, value) {
    return this.query(conn, 'RELEASE SAVEPOINT ' + this.txid + ';', 1, value);
  };

  Transaction.prototype.rollback = function rollback(conn, error) {
    var _this2 = this;

    return this.query(conn, 'ROLLBACK;', 2, error).timeout(5000).catch(_bluebird2.default.TimeoutError, function () {
      _this2._resolver();
    });
  };

  Transaction.prototype.rollbackTo = function rollbackTo(conn, error) {
    var _this3 = this;

    return this.query(conn, 'ROLLBACK TO SAVEPOINT ' + this.txid, 2, error).timeout(5000).catch(_bluebird2.default.TimeoutError, function () {
      _this3._resolver();
    });
  };

  Transaction.prototype.query = function query(conn, sql, status, value) {
    var _this4 = this;

    var q = this.trxClient.query(conn, sql).catch(function (err) {
      status = 2;
      value = err;
      _this4._completed = true;
      debug('%s error running transaction query', _this4.txid);
    }).tap(function () {
      if (status === 1) _this4._resolver(value);
      if (status === 2) _this4._rejecter(value);
    });
    if (status === 1 || status === 2) {
      this._completed = true;
    }
    return q;
  };

  Transaction.prototype.debug = function debug(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  };

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.


  Transaction.prototype.acquireConnection = function acquireConnection(client, config, txid) {
    var configConnection = config && config.connection;
    return _bluebird2.default.try(function () {
      return configConnection || client.acquireConnection();
    }).disposer(function (connection) {
      if (!configConnection) {
        debug('%s: releasing connection', txid);
        client.releaseConnection(connection);
      } else {
        debug('%s: not releasing external connection', txid);
      }
    });
  };

  return Transaction;
}(_events.EventEmitter);

// The transactor is a full featured knex object, with a "commit", a "rollback"
// and a "savepoint" function. The "savepoint" is just sugar for creating a new
// transaction. If the rollback is run inside a savepoint, it rolls back to the
// last savepoint - otherwise it rolls back the transaction.


exports.default = Transaction;
function makeTransactor(trx, connection, trxClient) {

  var transactor = (0, _makeKnex2.default)(trxClient);

  transactor.transaction = function (container, options) {
    return trxClient.transaction(container, options, trx);
  };
  transactor.savepoint = function (container, options) {
    return transactor.transaction(container, options);
  };

  if (trx.client.transacting) {
    transactor.commit = function (value) {
      return trx.release(connection, value);
    };
    transactor.rollback = function (error) {
      return trx.rollbackTo(connection, error);
    };
  } else {
    transactor.commit = function (value) {
      return trx.commit(connection, value);
    };
    transactor.rollback = function (error) {
      return trx.rollback(connection, error);
    };
  }

  return transactor;
}

// We need to make a client object which always acquires the same
// connection and does not release back into the pool.
function makeTxClient(trx, client, connection) {

  var trxClient = (0, _create2.default)(client.constructor.prototype);
  trxClient.config = client.config;
  trxClient.driver = client.driver;
  trxClient.connectionSettings = client.connectionSettings;
  trxClient.transacting = true;
  trxClient.valueForUndefined = client.valueForUndefined;

  trxClient.on('query', function (arg) {
    trx.emit('query', arg);
    client.emit('query', arg);
  });

  trxClient.on('query-error', function (err, obj) {
    trx.emit('query-error', err, obj);
    client.emit('query-error', err, obj);
  });

  trxClient.on('query-response', function (response, obj, builder) {
    trx.emit('query-response', response, obj, builder);
    client.emit('query-response', response, obj, builder);
  });

  var _query = trxClient.query;
  trxClient.query = function (conn, obj) {
    var completed = trx.isCompleted();
    return _bluebird2.default.try(function () {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
      if (completed) completedError(trx, obj);
      return _query.call(trxClient, conn, obj);
    });
  };
  var _stream = trxClient.stream;
  trxClient.stream = function (conn, obj, stream, options) {
    var completed = trx.isCompleted();
    return _bluebird2.default.try(function () {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
      if (completed) completedError(trx, obj);
      return _stream.call(trxClient, conn, obj, stream, options);
    });
  };
  trxClient.acquireConnection = function () {
    return _bluebird2.default.resolve(connection);
  };
  trxClient.releaseConnection = function () {
    return _bluebird2.default.resolve();
  };

  return trxClient;
}

function completedError(trx, obj) {
  var sql = typeof obj === 'string' ? obj : obj && obj.sql;
  debug('%s: Transaction completed: %s', trx.id, sql);
  throw new Error('Transaction query already complete, run with DEBUG=knex:tx for more info');
}

var promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'exec', 'reflect', 'get', 'mapSeries', 'delay'];

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`.
promiseInterface.forEach(function (method) {
  Transaction.prototype[method] = function () {
    return this._promise = this._promise[method].apply(this._promise, arguments);
  };
});
module.exports = exports['default'];