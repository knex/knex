'use strict';

exports.__esModule = true;

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _makeKnex = require('./util/make-knex');

var _makeKnex2 = _interopRequireDefault(_makeKnex);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Transaction
// -------
const debug = (0, _debug2.default)('knex:tx');

// Acts as a facade for a Promise, keeping the internal state
// and managing any child transactions.
class Transaction extends _events.EventEmitter {

  constructor(client, container, config, outerTx) {
    super();

    const txid = this.txid = (0, _lodash.uniqueId)('trx');

    this.client = client;
    this.logger = client.logger;
    this.outerTx = outerTx;
    this.trxClient = undefined;
    this._debug = client.config && client.config.debug;

    debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level');

    this._promise = _bluebird2.default.using(this.acquireConnection(client, config, txid), connection => {

      const trxClient = this.trxClient = makeTxClient(this, client, connection);
      const init = client.transacting ? this.savepoint(connection) : this.begin(connection);

      init.then(() => {
        return makeTransactor(this, connection, trxClient);
      }).then(transactor => {
        // If we've returned a "thenable" from the transaction container, assume
        // the rollback and commit are chained to this object's success / failure.
        // Directly thrown errors are treated as automatic rollbacks.
        let result;
        try {
          result = container(transactor);
        } catch (err) {
          result = _bluebird2.default.reject(err);
        }
        if (result && result.then && typeof result.then === 'function') {
          result.then(val => {
            return transactor.commit(val);
          }).catch(err => {
            return transactor.rollback(err);
          });
        }
        return null;
      }).catch(e => this._rejecter(e));

      return new _bluebird2.default((resolver, rejecter) => {
        this._resolver = resolver;
        this._rejecter = rejecter;
      });
    });

    this._completed = false;

    // If there's a wrapping transaction, we need to wait for any older sibling
    // transactions to settle (commit or rollback) before we can start, and we
    // need to register ourselves with the parent transaction so any younger
    // siblings can wait for us to complete before they can start.
    this._previousSibling = _bluebird2.default.resolve(true);
    if (outerTx) {
      if (outerTx._lastChild) this._previousSibling = outerTx._lastChild;
      outerTx._lastChild = this._promise;
    }
  }

  isCompleted() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || false;
  }

  begin(conn) {
    return this.query(conn, 'BEGIN;');
  }

  savepoint(conn) {
    return this.query(conn, `SAVEPOINT ${this.txid};`);
  }

  commit(conn, value) {
    return this.query(conn, 'COMMIT;', 1, value);
  }

  release(conn, value) {
    return this.query(conn, `RELEASE SAVEPOINT ${this.txid};`, 1, value);
  }

  rollback(conn, error) {
    return this.query(conn, 'ROLLBACK;', 2, error).timeout(5000).catch(_bluebird2.default.TimeoutError, () => {
      this._rejecter(error);
    });
  }

  rollbackTo(conn, error) {
    return this.query(conn, `ROLLBACK TO SAVEPOINT ${this.txid}`, 2, error).timeout(5000).catch(_bluebird2.default.TimeoutError, () => {
      this._rejecter(error);
    });
  }

  query(conn, sql, status, value) {
    const q = this.trxClient.query(conn, sql).catch(err => {
      status = 2;
      value = err;
      this._completed = true;
      debug('%s error running transaction query', this.txid);
    }).tap(() => {
      if (status === 1) {
        this._resolver(value);
      }
      if (status === 2) {
        if ((0, _lodash.isUndefined)(value)) {
          value = new Error(`Transaction rejected with non-error: ${value}`);
        }
        this._rejecter(value);
      }
    });
    if (status === 1 || status === 2) {
      this._completed = true;
    }
    return q;
  }

  debug(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  }

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection(client, config, txid) {
    const configConnection = config && config.connection;
    return _bluebird2.default.try(() => configConnection || client.acquireConnection()).then(function (connection) {
      connection.__knexTxId = txid;

      return connection;
    }).disposer(function (connection) {
      if (!configConnection) {
        debug('%s: releasing connection', txid);
        client.releaseConnection(connection);
      } else {
        debug('%s: not releasing external connection', txid);
      }
    });
  }

}

exports.default = Transaction; // The transactor is a full featured knex object, with a "commit", a "rollback"
// and a "savepoint" function. The "savepoint" is just sugar for creating a new
// transaction. If the rollback is run inside a savepoint, it rolls back to the
// last savepoint - otherwise it rolls back the transaction.

function makeTransactor(trx, connection, trxClient) {

  const transactor = (0, _makeKnex2.default)(trxClient);

  transactor.transaction = function (container, options) {
    return trxClient.transaction(container, options, trx);
  };
  transactor.savepoint = function (container, options) {
    return transactor.transaction(container, options);
  };

  if (trx.client.transacting) {
    transactor.commit = value => trx.release(connection, value);
    transactor.rollback = error => trx.rollbackTo(connection, error);
  } else {
    transactor.commit = value => trx.commit(connection, value);
    transactor.rollback = error => trx.rollback(connection, error);
  }

  return transactor;
}

// We need to make a client object which always acquires the same
// connection and does not release back into the pool.
function makeTxClient(trx, client, connection) {

  const trxClient = (0, _create2.default)(client.constructor.prototype);
  trxClient.config = client.config;
  trxClient.driver = client.driver;
  trxClient.connectionSettings = client.connectionSettings;
  trxClient.transacting = true;
  trxClient.valueForUndefined = client.valueForUndefined;
  trxClient.logger = client.logger;

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

  const _query = trxClient.query;
  trxClient.query = function (conn, obj) {
    const completed = trx.isCompleted();
    return _bluebird2.default.try(function () {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
      if (completed) completedError(trx, obj);
      return _query.call(trxClient, conn, obj);
    });
  };
  const _stream = trxClient.stream;
  trxClient.stream = function (conn, obj, stream, options) {
    const completed = trx.isCompleted();
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
  const sql = typeof obj === 'string' ? obj : obj && obj.sql;
  debug('%s: Transaction completed: %s', trx.txid, sql);
  throw new Error('Transaction query already complete, run with DEBUG=knex:tx for more info');
}

const promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'exec', 'reflect', 'get', 'mapSeries', 'delay'];

// Creates methods which proxy promise interface methods to 
// internal transaction resolution promise
promiseInterface.forEach(function (method) {
  Transaction.prototype[method] = function () {
    return this._promise[method].apply(this._promise, arguments);
  };
});
module.exports = exports['default'];