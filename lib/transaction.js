
// Transaction
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _promise = require('./promise');

var _promise2 = _interopRequireDefault(_promise);

var _events = require('events');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _utilMakeKnex = require('./util/make-knex');

var _utilMakeKnex2 = _interopRequireDefault(_utilMakeKnex);

var _utilNoop = require('./util/noop');

var _utilNoop2 = _interopRequireDefault(_utilNoop);

var _lodash = require('lodash');

// Acts as a facade for a Promise, keeping the internal state
// and managing any child transactions.

var debug = _debug2['default']('knex:tx');

function Transaction(client, container, config, outerTx) {
  var _this = this;

  var txid = this.txid = _lodash.uniqueId('trx');

  this.client = client;
  this.outerTx = outerTx;
  this.trxClient = undefined;
  this._debug = client.config && client.config.debug;

  debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level');

  this._promise = _promise2['default'].using(this.acquireConnection(client, config, txid), function (connection) {

    var trxClient = _this.trxClient = makeTxClient(_this, client, connection);
    var init = client.transacting ? _this.savepoint(connection) : _this.begin(connection);

    init.then(function () {
      return makeTransactor(_this, connection, trxClient);
    }).then(function (transactor) {
      // If we've returned a "thenable" from the transaction container, assume
      // the rollback and commit are chained to this object's success / failure.
      // Directly thrown errors are treated as automatic rollbacks.
      var result = undefined;
      try {
        result = container(transactor);
      } catch (err) {
        result = _promise2['default'].reject(err);
      }
      if (result && result.then && typeof result.then === 'function') {
        result.then(function (val) {
          return transactor.commit(val);
        })['catch'](function (err) {
          return transactor.rollback(err);
        });
      }
      return null;
    })['catch'](function (e) {
      return _this._rejecter(e);
    });

    return new _promise2['default'](function (resolver, rejecter) {
      _this._resolver = resolver;
      _this._rejecter = rejecter;
    });
  });

  this._completed = false;

  // If there's a wrapping transaction, we need to wait for any older sibling
  // transactions to settle (commit or rollback) before we can start, and we
  // need to register ourselves with the parent transaction so any younger
  // siblings can wait for us to complete before they can start.
  this._previousSibling = _promise2['default'].resolve(true);
  if (outerTx) {
    if (outerTx._lastChild) this._previousSibling = outerTx._lastChild;
    outerTx._lastChild = this._promise;
  }
}
_inherits2['default'](Transaction, _events.EventEmitter);

_lodash.assign(Transaction.prototype, {

  isCompleted: function isCompleted() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || false;
  },

  begin: function begin(conn) {
    return this.query(conn, 'BEGIN;');
  },

  savepoint: function savepoint(conn) {
    return this.query(conn, 'SAVEPOINT ' + this.txid + ';');
  },

  commit: function commit(conn, value) {
    return this.query(conn, 'COMMIT;', 1, value);
  },

  release: function release(conn, value) {
    return this.query(conn, 'RELEASE SAVEPOINT ' + this.txid + ';', 1, value);
  },

  rollback: function rollback(conn, error) {
    var _this2 = this;

    return this.query(conn, 'ROLLBACK;', 2, error).timeout(5000)['catch'](_promise2['default'].TimeoutError, function () {
      _this2._resolver();
    });
  },

  rollbackTo: function rollbackTo(conn, error) {
    var _this3 = this;

    return this.query(conn, 'ROLLBACK TO SAVEPOINT ' + this.txid, 2, error).timeout(5000)['catch'](_promise2['default'].TimeoutError, function () {
      _this3._resolver();
    });
  },

  query: function query(conn, sql, status, value) {
    var _this4 = this;

    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
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
  },

  debug: function debug(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  },

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection: function acquireConnection(client, config, txid) {
    var configConnection = config && config.connection;
    return _promise2['default']['try'](function () {
      return configConnection || client.acquireConnection().completed;
    }).disposer(function (connection) {
      if (!configConnection) {
        debug('%s: releasing connection', txid);
        client.releaseConnection(connection);
      } else {
        debug('%s: not releasing external connection', txid);
      }
    });
  }

});

// The transactor is a full featured knex object, with a "commit", a "rollback"
// and a "savepoint" function. The "savepoint" is just sugar for creating a new
// transaction. If the rollback is run inside a savepoint, it rolls back to the
// last savepoint - otherwise it rolls back the transaction.
function makeTransactor(trx, connection, trxClient) {

  var transactor = _utilMakeKnex2['default'](trxClient);

  transactor.transaction = function (container, options) {
    return new trxClient.Transaction(trxClient, container, options, trx);
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

  var trxClient = Object.create(client.constructor.prototype);
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
    return _promise2['default']['try'](function () {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
      if (completed) completedError(trx, obj);
      return _query.call(trxClient, conn, obj);
    });
  };
  var _stream = trxClient.stream;
  trxClient.stream = function (conn, obj, stream, options) {
    var completed = trx.isCompleted();
    return _promise2['default']['try'](function () {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
      if (completed) completedError(trx, obj);
      return _stream.call(trxClient, conn, obj, stream, options);
    });
  };
  trxClient.acquireConnection = function () {
    return {
      completed: trx._previousSibling.reflect().then(function () {
        return connection;
      }),
      abort: _utilNoop2['default']
    };
  };
  trxClient.releaseConnection = function () {
    return _promise2['default'].resolve();
  };

  return trxClient;
}

function completedError(trx, obj) {
  var sql = typeof obj === 'string' ? obj : obj && obj.sql;
  debug('%s: Transaction completed: %s', trx.id, sql);
  throw new Error('Transaction query already complete, run with DEBUG=knex:tx for more info');
}

var promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'exec', 'reflect'];

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`.
promiseInterface.forEach(function (method) {
  Transaction.prototype[method] = function () {
    return this._promise = this._promise[method].apply(this._promise, arguments);
  };
});

exports['default'] = Transaction;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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RyxDQUN2QixNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUNoRCxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUM5QyxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUMvQyxDQUFBOzs7O0FBSUQsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQ3hDLGFBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsWUFBVztBQUN6QyxXQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztHQUMvRSxDQUFBO0NBQ0YsQ0FBQyxDQUFBOztxQkFFYSxXQUFXIiwiZmlsZSI6InRyYW5zYWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBUcmFuc2FjdGlvblxuLy8gLS0tLS0tLVxuaW1wb3J0IFByb21pc2UgZnJvbSAnLi9wcm9taXNlJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJ1xuXG5pbXBvcnQgbWFrZUtuZXggZnJvbSAnLi91dGlsL21ha2Uta25leCc7XG5pbXBvcnQgbm9vcCBmcm9tICcuL3V0aWwvbm9vcCc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2tuZXg6dHgnKTtcblxuaW1wb3J0IHsgYXNzaWduLCB1bmlxdWVJZCB9IGZyb20gJ2xvZGFzaCc7XG5cbi8vIEFjdHMgYXMgYSBmYWNhZGUgZm9yIGEgUHJvbWlzZSwga2VlcGluZyB0aGUgaW50ZXJuYWwgc3RhdGVcbi8vIGFuZCBtYW5hZ2luZyBhbnkgY2hpbGQgdHJhbnNhY3Rpb25zLlxuZnVuY3Rpb24gVHJhbnNhY3Rpb24oY2xpZW50LCBjb250YWluZXIsIGNvbmZpZywgb3V0ZXJUeCkge1xuXG4gIGNvbnN0IHR4aWQgPSB0aGlzLnR4aWQgPSB1bmlxdWVJZCgndHJ4JylcblxuICB0aGlzLmNsaWVudCAgICA9IGNsaWVudFxuICB0aGlzLm91dGVyVHggICA9IG91dGVyVHhcbiAgdGhpcy50cnhDbGllbnQgPSB1bmRlZmluZWQ7XG4gIHRoaXMuX2RlYnVnICAgID0gY2xpZW50LmNvbmZpZyAmJiBjbGllbnQuY29uZmlnLmRlYnVnXG5cbiAgZGVidWcoJyVzOiBTdGFydGluZyAlcyB0cmFuc2FjdGlvbicsIHR4aWQsIG91dGVyVHggPyAnbmVzdGVkJyA6ICd0b3AgbGV2ZWwnKVxuXG4gIHRoaXMuX3Byb21pc2UgPSBQcm9taXNlLnVzaW5nKHRoaXMuYWNxdWlyZUNvbm5lY3Rpb24oY2xpZW50LCBjb25maWcsIHR4aWQpLCAoY29ubmVjdGlvbikgPT4ge1xuXG4gICAgY29uc3QgdHJ4Q2xpZW50ID0gdGhpcy50cnhDbGllbnQgPSBtYWtlVHhDbGllbnQodGhpcywgY2xpZW50LCBjb25uZWN0aW9uKVxuICAgIGNvbnN0IGluaXQgPSBjbGllbnQudHJhbnNhY3RpbmcgPyB0aGlzLnNhdmVwb2ludChjb25uZWN0aW9uKSA6IHRoaXMuYmVnaW4oY29ubmVjdGlvbilcblxuICAgIGluaXQudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gbWFrZVRyYW5zYWN0b3IodGhpcywgY29ubmVjdGlvbiwgdHJ4Q2xpZW50KVxuICAgIH0pXG4gICAgLnRoZW4oKHRyYW5zYWN0b3IpID0+IHtcbiAgICAgIC8vIElmIHdlJ3ZlIHJldHVybmVkIGEgXCJ0aGVuYWJsZVwiIGZyb20gdGhlIHRyYW5zYWN0aW9uIGNvbnRhaW5lciwgYXNzdW1lXG4gICAgICAvLyB0aGUgcm9sbGJhY2sgYW5kIGNvbW1pdCBhcmUgY2hhaW5lZCB0byB0aGlzIG9iamVjdCdzIHN1Y2Nlc3MgLyBmYWlsdXJlLlxuICAgICAgLy8gRGlyZWN0bHkgdGhyb3duIGVycm9ycyBhcmUgdHJlYXRlZCBhcyBhdXRvbWF0aWMgcm9sbGJhY2tzLlxuICAgICAgbGV0IHJlc3VsdFxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gY29udGFpbmVyKHRyYW5zYWN0b3IpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZWplY3QoZXJyKVxuICAgICAgfVxuICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQudGhlbiAmJiB0eXBlb2YgcmVzdWx0LnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmVzdWx0LnRoZW4oKHZhbCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0cmFuc2FjdG9yLmNvbW1pdCh2YWwpXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0b3Iucm9sbGJhY2soZXJyKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHRoaXMuX3JlamVjdGVyKGUpKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlciwgcmVqZWN0ZXIpID0+IHtcbiAgICAgIHRoaXMuX3Jlc29sdmVyID0gcmVzb2x2ZXJcbiAgICAgIHRoaXMuX3JlamVjdGVyID0gcmVqZWN0ZXJcbiAgICB9KVxuICB9KVxuXG4gIHRoaXMuX2NvbXBsZXRlZCAgPSBmYWxzZVxuXG4gIC8vIElmIHRoZXJlJ3MgYSB3cmFwcGluZyB0cmFuc2FjdGlvbiwgd2UgbmVlZCB0byB3YWl0IGZvciBhbnkgb2xkZXIgc2libGluZ1xuICAvLyB0cmFuc2FjdGlvbnMgdG8gc2V0dGxlIChjb21taXQgb3Igcm9sbGJhY2spIGJlZm9yZSB3ZSBjYW4gc3RhcnQsIGFuZCB3ZVxuICAvLyBuZWVkIHRvIHJlZ2lzdGVyIG91cnNlbHZlcyB3aXRoIHRoZSBwYXJlbnQgdHJhbnNhY3Rpb24gc28gYW55IHlvdW5nZXJcbiAgLy8gc2libGluZ3MgY2FuIHdhaXQgZm9yIHVzIHRvIGNvbXBsZXRlIGJlZm9yZSB0aGV5IGNhbiBzdGFydC5cbiAgdGhpcy5fcHJldmlvdXNTaWJsaW5nID0gUHJvbWlzZS5yZXNvbHZlKHRydWUpO1xuICBpZiAob3V0ZXJUeCkge1xuICAgIGlmIChvdXRlclR4Ll9sYXN0Q2hpbGQpIHRoaXMuX3ByZXZpb3VzU2libGluZyA9IG91dGVyVHguX2xhc3RDaGlsZDtcbiAgICBvdXRlclR4Ll9sYXN0Q2hpbGQgPSB0aGlzLl9wcm9taXNlO1xuICB9XG59XG5pbmhlcml0cyhUcmFuc2FjdGlvbiwgRXZlbnRFbWl0dGVyKVxuXG5hc3NpZ24oVHJhbnNhY3Rpb24ucHJvdG90eXBlLCB7XG5cbiAgaXNDb21wbGV0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlZCB8fCB0aGlzLm91dGVyVHggJiYgdGhpcy5vdXRlclR4LmlzQ29tcGxldGVkKCkgfHwgZmFsc2VcbiAgfSxcblxuICBiZWdpbihjb25uKSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoY29ubiwgJ0JFR0lOOycpXG4gIH0sXG5cbiAgc2F2ZXBvaW50KGNvbm4pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShjb25uLCBgU0FWRVBPSU5UICR7dGhpcy50eGlkfTtgKVxuICB9LFxuXG4gIGNvbW1pdChjb25uLCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5KGNvbm4sICdDT01NSVQ7JywgMSwgdmFsdWUpXG4gIH0sXG5cbiAgcmVsZWFzZShjb25uLCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5KGNvbm4sIGBSRUxFQVNFIFNBVkVQT0lOVCAke3RoaXMudHhpZH07YCwgMSwgdmFsdWUpXG4gIH0sXG5cbiAgcm9sbGJhY2soY29ubiwgZXJyb3IpIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShjb25uLCAnUk9MTEJBQ0s7JywgMiwgZXJyb3IpXG4gICAgICAudGltZW91dCg1MDAwKVxuICAgICAgLmNhdGNoKFByb21pc2UuVGltZW91dEVycm9yLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmVyKCk7XG4gICAgICB9KTtcbiAgfSxcblxuICByb2xsYmFja1RvKGNvbm4sIGVycm9yKSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoY29ubiwgYFJPTExCQUNLIFRPIFNBVkVQT0lOVCAke3RoaXMudHhpZH1gLCAyLCBlcnJvcilcbiAgICAgIC50aW1lb3V0KDUwMDApXG4gICAgICAuY2F0Y2goUHJvbWlzZS5UaW1lb3V0RXJyb3IsICgpID0+IHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZXIoKTtcbiAgICAgIH0pO1xuICB9LFxuXG4gIHF1ZXJ5KGNvbm4sIHNxbCwgc3RhdHVzLCB2YWx1ZSkge1xuICAgIGNvbnN0IHEgPSB0aGlzLnRyeENsaWVudC5xdWVyeShjb25uLCBzcWwpXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBzdGF0dXMgPSAyXG4gICAgICAgIHZhbHVlICA9IGVyclxuICAgICAgICB0aGlzLl9jb21wbGV0ZWQgPSB0cnVlXG4gICAgICAgIGRlYnVnKCclcyBlcnJvciBydW5uaW5nIHRyYW5zYWN0aW9uIHF1ZXJ5JywgdGhpcy50eGlkKVxuICAgICAgfSlcbiAgICAgIC50YXAoKCkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzID09PSAxKSB0aGlzLl9yZXNvbHZlcih2YWx1ZSlcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gMikgdGhpcy5fcmVqZWN0ZXIodmFsdWUpXG4gICAgICB9KVxuICAgIGlmIChzdGF0dXMgPT09IDEgfHwgc3RhdHVzID09PSAyKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZWQgPSB0cnVlXG4gICAgfVxuICAgIHJldHVybiBxO1xuICB9LFxuXG4gIGRlYnVnKGVuYWJsZWQpIHtcbiAgICB0aGlzLl9kZWJ1ZyA9IGFyZ3VtZW50cy5sZW5ndGggPyBlbmFibGVkIDogdHJ1ZTtcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIC8vIEFjcXVpcmUgYSBjb25uZWN0aW9uIGFuZCBjcmVhdGUgYSBkaXNwb3NlciAtIGVpdGhlciB1c2luZyB0aGUgb25lIHBhc3NlZFxuICAvLyB2aWEgY29uZmlnIG9yIGdldHRpbmcgb25lIG9mZiB0aGUgY2xpZW50LiBUaGUgZGlzcG9zZXIgd2lsbCBiZSBjYWxsZWQgb25jZVxuICAvLyB0aGUgb3JpZ2luYWwgcHJvbWlzZSBpcyBtYXJrZWQgY29tcGxldGVkLlxuICBhY3F1aXJlQ29ubmVjdGlvbihjbGllbnQsIGNvbmZpZywgdHhpZCkge1xuICAgIGNvbnN0IGNvbmZpZ0Nvbm5lY3Rpb24gPSBjb25maWcgJiYgY29uZmlnLmNvbm5lY3Rpb25cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4gY29uZmlnQ29ubmVjdGlvbiB8fCBjbGllbnQuYWNxdWlyZUNvbm5lY3Rpb24oKS5jb21wbGV0ZWQpXG4gICAgLmRpc3Bvc2VyKGZ1bmN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgICAgIGlmICghY29uZmlnQ29ubmVjdGlvbikge1xuICAgICAgICBkZWJ1ZygnJXM6IHJlbGVhc2luZyBjb25uZWN0aW9uJywgdHhpZClcbiAgICAgICAgY2xpZW50LnJlbGVhc2VDb25uZWN0aW9uKGNvbm5lY3Rpb24pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1ZygnJXM6IG5vdCByZWxlYXNpbmcgZXh0ZXJuYWwgY29ubmVjdGlvbicsIHR4aWQpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG59KVxuXG4vLyBUaGUgdHJhbnNhY3RvciBpcyBhIGZ1bGwgZmVhdHVyZWQga25leCBvYmplY3QsIHdpdGggYSBcImNvbW1pdFwiLCBhIFwicm9sbGJhY2tcIlxuLy8gYW5kIGEgXCJzYXZlcG9pbnRcIiBmdW5jdGlvbi4gVGhlIFwic2F2ZXBvaW50XCIgaXMganVzdCBzdWdhciBmb3IgY3JlYXRpbmcgYSBuZXdcbi8vIHRyYW5zYWN0aW9uLiBJZiB0aGUgcm9sbGJhY2sgaXMgcnVuIGluc2lkZSBhIHNhdmVwb2ludCwgaXQgcm9sbHMgYmFjayB0byB0aGVcbi8vIGxhc3Qgc2F2ZXBvaW50IC0gb3RoZXJ3aXNlIGl0IHJvbGxzIGJhY2sgdGhlIHRyYW5zYWN0aW9uLlxuZnVuY3Rpb24gbWFrZVRyYW5zYWN0b3IodHJ4LCBjb25uZWN0aW9uLCB0cnhDbGllbnQpIHtcblxuICBjb25zdCB0cmFuc2FjdG9yID0gbWFrZUtuZXgodHJ4Q2xpZW50KTtcblxuICB0cmFuc2FjdG9yLnRyYW5zYWN0aW9uID0gKGNvbnRhaW5lciwgb3B0aW9ucykgPT5cbiAgICBuZXcgdHJ4Q2xpZW50LlRyYW5zYWN0aW9uKHRyeENsaWVudCwgY29udGFpbmVyLCBvcHRpb25zLCB0cngpO1xuXG4gIHRyYW5zYWN0b3Iuc2F2ZXBvaW50ID0gKGNvbnRhaW5lciwgb3B0aW9ucykgPT5cbiAgICB0cmFuc2FjdG9yLnRyYW5zYWN0aW9uKGNvbnRhaW5lciwgb3B0aW9ucyk7XG5cbiAgaWYgKHRyeC5jbGllbnQudHJhbnNhY3RpbmcpIHtcbiAgICB0cmFuc2FjdG9yLmNvbW1pdCA9IHZhbHVlID0+IHRyeC5yZWxlYXNlKGNvbm5lY3Rpb24sIHZhbHVlKVxuICAgIHRyYW5zYWN0b3Iucm9sbGJhY2sgPSBlcnJvciA9PiB0cngucm9sbGJhY2tUbyhjb25uZWN0aW9uLCBlcnJvcilcbiAgfSBlbHNlIHtcbiAgICB0cmFuc2FjdG9yLmNvbW1pdCA9IHZhbHVlID0+IHRyeC5jb21taXQoY29ubmVjdGlvbiwgdmFsdWUpXG4gICAgdHJhbnNhY3Rvci5yb2xsYmFjayA9IGVycm9yID0+IHRyeC5yb2xsYmFjayhjb25uZWN0aW9uLCBlcnJvcilcbiAgfVxuXG4gIHJldHVybiB0cmFuc2FjdG9yXG59XG5cblxuLy8gV2UgbmVlZCB0byBtYWtlIGEgY2xpZW50IG9iamVjdCB3aGljaCBhbHdheXMgYWNxdWlyZXMgdGhlIHNhbWVcbi8vIGNvbm5lY3Rpb24gYW5kIGRvZXMgbm90IHJlbGVhc2UgYmFjayBpbnRvIHRoZSBwb29sLlxuZnVuY3Rpb24gbWFrZVR4Q2xpZW50KHRyeCwgY2xpZW50LCBjb25uZWN0aW9uKSB7XG5cbiAgY29uc3QgdHJ4Q2xpZW50ID0gT2JqZWN0LmNyZWF0ZShjbGllbnQuY29uc3RydWN0b3IucHJvdG90eXBlKVxuICB0cnhDbGllbnQuY29uZmlnICAgICAgICAgICAgID0gY2xpZW50LmNvbmZpZ1xuICB0cnhDbGllbnQuZHJpdmVyICAgICAgICAgICAgID0gY2xpZW50LmRyaXZlclxuICB0cnhDbGllbnQuY29ubmVjdGlvblNldHRpbmdzID0gY2xpZW50LmNvbm5lY3Rpb25TZXR0aW5nc1xuICB0cnhDbGllbnQudHJhbnNhY3RpbmcgICAgICAgID0gdHJ1ZVxuICB0cnhDbGllbnQudmFsdWVGb3JVbmRlZmluZWQgID0gY2xpZW50LnZhbHVlRm9yVW5kZWZpbmVkXG5cbiAgdHJ4Q2xpZW50Lm9uKCdxdWVyeScsIGZ1bmN0aW9uKGFyZykge1xuICAgIHRyeC5lbWl0KCdxdWVyeScsIGFyZylcbiAgICBjbGllbnQuZW1pdCgncXVlcnknLCBhcmcpXG4gIH0pXG5cbiAgdHJ4Q2xpZW50Lm9uKCdxdWVyeS1lcnJvcicsIGZ1bmN0aW9uKGVyciwgb2JqKSB7XG4gICAgdHJ4LmVtaXQoJ3F1ZXJ5LWVycm9yJywgZXJyLCBvYmopXG4gICAgY2xpZW50LmVtaXQoJ3F1ZXJ5LWVycm9yJywgZXJyLCBvYmopXG4gIH0pXG5cbiAgdHJ4Q2xpZW50Lm9uKCdxdWVyeS1yZXNwb25zZScsIGZ1bmN0aW9uKHJlc3BvbnNlLCBvYmosIGJ1aWxkZXIpIHtcbiAgICB0cnguZW1pdCgncXVlcnktcmVzcG9uc2UnLCByZXNwb25zZSwgb2JqLCBidWlsZGVyKVxuICAgIGNsaWVudC5lbWl0KCdxdWVyeS1yZXNwb25zZScsIHJlc3BvbnNlLCBvYmosIGJ1aWxkZXIpXG4gIH0pXG5cbiAgY29uc3QgX3F1ZXJ5ID0gdHJ4Q2xpZW50LnF1ZXJ5O1xuICB0cnhDbGllbnQucXVlcnkgID0gZnVuY3Rpb24oY29ubiwgb2JqKSB7XG4gICAgY29uc3QgY29tcGxldGVkID0gdHJ4LmlzQ29tcGxldGVkKClcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoY29ubiAhPT0gY29ubmVjdGlvbikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbm5lY3Rpb24gZm9yIHRyYW5zYWN0aW9uIHF1ZXJ5LicpXG4gICAgICBpZiAoY29tcGxldGVkKSBjb21wbGV0ZWRFcnJvcih0cngsIG9iailcbiAgICAgIHJldHVybiBfcXVlcnkuY2FsbCh0cnhDbGllbnQsIGNvbm4sIG9iailcbiAgICB9KVxuICB9XG4gIGNvbnN0IF9zdHJlYW0gPSB0cnhDbGllbnQuc3RyZWFtXG4gIHRyeENsaWVudC5zdHJlYW0gPSBmdW5jdGlvbihjb25uLCBvYmosIHN0cmVhbSwgb3B0aW9ucykge1xuICAgIGNvbnN0IGNvbXBsZXRlZCA9IHRyeC5pc0NvbXBsZXRlZCgpXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGNvbm4gIT09IGNvbm5lY3Rpb24pIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb25uZWN0aW9uIGZvciB0cmFuc2FjdGlvbiBxdWVyeS4nKVxuICAgICAgaWYgKGNvbXBsZXRlZCkgY29tcGxldGVkRXJyb3IodHJ4LCBvYmopXG4gICAgICByZXR1cm4gX3N0cmVhbS5jYWxsKHRyeENsaWVudCwgY29ubiwgb2JqLCBzdHJlYW0sIG9wdGlvbnMpXG4gICAgfSlcbiAgfVxuICB0cnhDbGllbnQuYWNxdWlyZUNvbm5lY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBsZXRlZDogdHJ4Ll9wcmV2aW91c1NpYmxpbmcucmVmbGVjdCgpLnRoZW4oKCkgPT4gY29ubmVjdGlvbiksXG4gICAgICBhYm9ydDogbm9vcFxuICAgIH1cbiAgfVxuICB0cnhDbGllbnQucmVsZWFzZUNvbm5lY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgfVxuXG4gIHJldHVybiB0cnhDbGllbnRcbn1cblxuZnVuY3Rpb24gY29tcGxldGVkRXJyb3IodHJ4LCBvYmopIHtcbiAgY29uc3Qgc3FsID0gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycgPyBvYmogOiBvYmogJiYgb2JqLnNxbFxuICBkZWJ1ZygnJXM6IFRyYW5zYWN0aW9uIGNvbXBsZXRlZDogJXMnLCB0cnguaWQsIHNxbClcbiAgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2FjdGlvbiBxdWVyeSBhbHJlYWR5IGNvbXBsZXRlLCBydW4gd2l0aCBERUJVRz1rbmV4OnR4IGZvciBtb3JlIGluZm8nKVxufVxuXG5jb25zdCBwcm9taXNlSW50ZXJmYWNlID0gW1xuICAndGhlbicsICdiaW5kJywgJ2NhdGNoJywgJ2ZpbmFsbHknLCAnYXNDYWxsYmFjaycsXG4gICdzcHJlYWQnLCAnbWFwJywgJ3JlZHVjZScsICd0YXAnLCAndGhlblJldHVybicsXG4gICdyZXR1cm4nLCAneWllbGQnLCAnZW5zdXJlJywgJ2V4ZWMnLCAncmVmbGVjdCdcbl1cblxuLy8gQ3JlYXRlcyBhIG1ldGhvZCB3aGljaCBcImNvZXJjZXNcIiB0byBhIHByb21pc2UsIGJ5IGNhbGxpbmcgYVxuLy8gXCJ0aGVuXCIgbWV0aG9kIG9uIHRoZSBjdXJyZW50IGBUYXJnZXRgLlxucHJvbWlzZUludGVyZmFjZS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICBUcmFuc2FjdGlvbi5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAodGhpcy5fcHJvbWlzZSA9IHRoaXMuX3Byb21pc2VbbWV0aG9kXS5hcHBseSh0aGlzLl9wcm9taXNlLCBhcmd1bWVudHMpKVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBUcmFuc2FjdGlvbjtcbiJdfQ==