// Transaction
// -------
const Bluebird = require('bluebird');
const { EventEmitter } = require('events');
const Debug = require('debug');

const makeKnex = require('./util/make-knex');

const debug = Debug('knex:tx');

const { uniqueId, isUndefined } = require('lodash');

// Acts as a facade for a Promise, keeping the internal state
// and managing any child transactions.
class Transaction extends EventEmitter {
  constructor(client, container, config, outerTx) {
    super();

    const txid = (this.txid = uniqueId('trx'));

    // If there is no container provided, assume user wants to get instance of transaction and use it directly
    if (!container) {
      // Default behaviour for new style of transactions is not to reject on rollback
      if (!config || isUndefined(config.doNotRejectOnRollback)) {
        this.doNotRejectOnRollback = true;
      } else {
        this.doNotRejectOnRollback = config.doNotRejectOnRollback;
      }

      this.initPromise = new Promise((resolve, reject) => {
        this.initRejectFn = reject;
        container = (transactor) => {
          resolve(transactor);
        };
      });
    } else {
      // Default behaviour for old style of transactions is to reject on rollback
      if (!config || isUndefined(config.doNotRejectOnRollback)) {
        this.doNotRejectOnRollback = false;
      } else {
        this.doNotRejectOnRollback = config.doNotRejectOnRollback;
      }
    }

    this.client = client;
    this.logger = client.logger;
    this.outerTx = outerTx;
    this.trxClient = undefined;
    this._debug = client.config && client.config.debug;

    debug(
      '%s: Starting %s transaction',
      txid,
      outerTx ? 'nested' : 'top level'
    );

    this._promise = Bluebird.using(
      this.acquireConnection(client, config, txid),
      (connection) => {
        const trxClient = (this.trxClient = makeTxClient(
          this,
          client,
          connection
        ));
        const init = client.transacting
          ? this.savepoint(connection)
          : this.begin(connection);
        const executionPromise = new Bluebird((resolver, rejecter) => {
          this._resolver = resolver;
          this._rejecter = rejecter;
        });

        init
          .then(() => {
            return makeTransactor(this, connection, trxClient);
          })
          .then((transactor) => {
            if (this.initPromise) {
              transactor.executionPromise = executionPromise.catch((err) => {
                throw err;
              });
            } else {
              transactor.executionPromise = executionPromise;
            }

            // If we've returned a "thenable" from the transaction container, assume
            // the rollback and commit are chained to this object's success / failure.
            // Directly thrown errors are treated as automatic rollbacks.
            let result;
            try {
              result = container(transactor);
            } catch (err) {
              result = Bluebird.reject(err);
            }
            if (result && result.then && typeof result.then === 'function') {
              result
                .then((val) => {
                  return transactor.commit(val);
                })
                .catch((err) => {
                  return transactor.rollback(err);
                });
            }
            return null;
          })
          .catch((e) => {
            return this._rejecter(e);
          });

        return executionPromise;
      }
    ).catch((err) => {
      if (this.initRejectFn) {
        this.initRejectFn(err);
      } else {
        throw err;
      }
    });

    this._completed = false;

    // If there's a wrapping transaction, we need to wait for any older sibling
    // transactions to settle (commit or rollback) before we can start, and we
    // need to register ourselves with the parent transaction so any younger
    // siblings can wait for us to complete before they can start.
    this._previousSibling = Bluebird.resolve(true);
    if (outerTx) {
      if (outerTx._lastChild) this._previousSibling = outerTx._lastChild;
      outerTx._lastChild = this._promise;
    }
  }

  isCompleted() {
    return (
      this._completed || (this.outerTx && this.outerTx.isCompleted()) || false
    );
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
    return this.query(conn, 'ROLLBACK', 2, error)
      .timeout(5000)
      .catch(Bluebird.TimeoutError, () => {
        this._rejecter(error);
      });
  }

  rollbackTo(conn, error) {
    return this.query(conn, `ROLLBACK TO SAVEPOINT ${this.txid}`, 2, error)
      .timeout(5000)
      .catch(Bluebird.TimeoutError, () => {
        this._rejecter(error);
      });
  }

  query(conn, sql, status, value) {
    const q = this.trxClient
      .query(conn, sql)
      .catch((err) => {
        status = 2;
        value = err;
        this._completed = true;
        debug('%s error running transaction query', this.txid);
      })
      .then((res) => {
        if (status === 1) {
          this._resolver(value);
        }
        if (status === 2) {
          if (isUndefined(value)) {
            if (this.doNotRejectOnRollback && /^ROLLBACK\b/i.test(sql)) {
              this._resolver();
              return;
            }

            value = new Error(`Transaction rejected with non-error: ${value}`);
          }
          this._rejecter(value);
        }
        return res;
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
    return new Bluebird((resolve, reject) => {
      try {
        resolve(configConnection || client.acquireConnection());
      } catch (e) {
        reject(e);
      }
    })
      .then(function(connection) {
        connection.__knexTxId = txid;

        return connection;
      })
      .disposer(function(connection) {
        if (!configConnection) {
          debug('%s: releasing connection', txid);
          client.releaseConnection(connection);
        } else {
          debug('%s: not releasing external connection', txid);
        }
      });
  }
}

// The transactor is a full featured knex object, with a "commit", a "rollback"
// and a "savepoint" function. The "savepoint" is just sugar for creating a new
// transaction. If the rollback is run inside a savepoint, it rolls back to the
// last savepoint - otherwise it rolls back the transaction.
function makeTransactor(trx, connection, trxClient) {
  const transactor = makeKnex(trxClient);

  transactor.withUserParams = () => {
    throw new Error(
      'Cannot set user params on a transaction - it can only inherit params from main knex instance'
    );
  };

  transactor.isTransaction = true;
  transactor.userParams = trx.userParams || {};

  transactor.transaction = function(container, options) {
    return trxClient.transaction(container, options, trx);
  };
  transactor.savepoint = function(container, options) {
    return transactor.transaction(container, options);
  };

  if (trx.client.transacting) {
    transactor.commit = (value) => trx.release(connection, value);
    transactor.rollback = (error) => trx.rollbackTo(connection, error);
  } else {
    transactor.commit = (value) => trx.commit(connection, value);
    transactor.rollback = (error) => trx.rollback(connection, error);
  }

  transactor.isCompleted = () => trx.isCompleted();

  return transactor;
}

// We need to make a client object which always acquires the same
// connection and does not release back into the pool.
function makeTxClient(trx, client, connection) {
  const trxClient = Object.create(client.constructor.prototype);
  trxClient.version = client.version;
  trxClient.config = client.config;
  trxClient.driver = client.driver;
  trxClient.connectionSettings = client.connectionSettings;
  trxClient.transacting = true;
  trxClient.valueForUndefined = client.valueForUndefined;
  trxClient.logger = client.logger;

  trxClient.on('query', function(arg) {
    trx.emit('query', arg);
    client.emit('query', arg);
  });

  trxClient.on('query-error', function(err, obj) {
    trx.emit('query-error', err, obj);
    client.emit('query-error', err, obj);
  });

  trxClient.on('query-response', function(response, obj, builder) {
    trx.emit('query-response', response, obj, builder);
    client.emit('query-response', response, obj, builder);
  });

  const _query = trxClient.query;
  trxClient.query = function(conn, obj) {
    const completed = trx.isCompleted();
    return new Bluebird(function(resolve, reject) {
      try {
        if (conn !== connection)
          throw new Error('Invalid connection for transaction query.');
        if (completed) completedError(trx, obj);
        resolve(_query.call(trxClient, conn, obj));
      } catch (e) {
        reject(e);
      }
    });
  };
  const _stream = trxClient.stream;
  trxClient.stream = function(conn, obj, stream, options) {
    const completed = trx.isCompleted();
    return new Bluebird(function(resolve, reject) {
      try {
        if (conn !== connection)
          throw new Error('Invalid connection for transaction query.');
        if (completed) completedError(trx, obj);
        resolve(_stream.call(trxClient, conn, obj, stream, options));
      } catch (e) {
        reject(e);
      }
    });
  };
  trxClient.acquireConnection = function() {
    return Bluebird.resolve(connection);
  };
  trxClient.releaseConnection = function() {
    return Bluebird.resolve();
  };

  return trxClient;
}

function completedError(trx, obj) {
  const sql = typeof obj === 'string' ? obj : obj && obj.sql;
  debug('%s: Transaction completed: %s', trx.txid, sql);
  throw new Error(
    'Transaction query already complete, run with DEBUG=knex:tx for more info'
  );
}

const promiseInterface = [
  'then',
  'bind',
  'catch',
  'finally',
  'asCallback',
  'spread',
  'map',
  'reduce',
  'thenReturn',
  'return',
  'yield',
  'ensure',
  'exec',
  'reflect',
  'get',
  'mapSeries',
  'delay',
];

// Creates methods which proxy promise interface methods to
// internal transaction resolution promise
promiseInterface.forEach(function(method) {
  Transaction.prototype[method] = function() {
    return this._promise[method].apply(this._promise, arguments);
  };
});

module.exports = Transaction;
