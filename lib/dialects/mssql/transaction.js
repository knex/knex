const Transaction = require('../../transaction');
const debug = require('debug')('knex:tx');

class Transaction_MSSQL extends Transaction {
  begin(conn) {
    debug('transaction::begin id=%s', this.txid);

    return new Bluebird((resolve, reject) => {
      conn.beginTransaction((err) => {
        if (err) {
          debug(
            'transaction::begin error id=%s message=%s',
            this.txid,
            err.message
          );
          return reject(err);
        }
        resolve();
      }, this.txid);
    }).then(this._resolver, this._rejecter);
  }

  savepoint(conn) {
    debug('transaction::savepoint id=%s', this.txid);

    return new Bluebird((resolve, reject) => {
      conn.saveTransaction((err) => {
        if (err) {
          debug(
            'transaction::savepoint id=%s message=%s',
            this.txid,
            err.message
          );
          return reject(err);
        }

        resolve();
      }, this.txid);
    });
  }

  commit(conn, value) {
    debug('transaction::commit id=%s', this.txid);

    return new Bluebird((resolve, reject) => {
      conn.commitTransaction((err) => {
        if (err) {
          debug(
            'transaction::commit error id=%s message=%s',
            this.txid,
            err.message
          );
          return reject(err);
        }

        this._completed = true;
        resolve(value);
      }, this.txid);
    }).then(() => this._resolver(value), this._rejecter);
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, error) {
    this._completed = true;
    debug('transaction::rollback id=%s', this.txid);

    return new Bluebird((_resolve, reject) => {
      if (!conn.inTransaction) {
        return reject(
          error || new Error('Transaction rejected with non-error: undefined')
        );
      }
      conn.rollbackTransaction((err) => {
        if (err) {
          debug(
            'transaction::rollback error id=%s message=%s',
            this.txid,
            err.message
          );
        }

        reject(
          err ||
            error ||
            new Error('Transaction rejected with non-error: undefined')
        );
      }, this.txid);
    }).catch((err) => {
      if (!error && this.doNotRejectOnRollback) {
        this._resolver();
        return;
      }
      if (error) {
        err.originalError = error;
      }
      this._rejecter(err);
    });
  }

  rollbackTo(conn, error) {
    return this.rollback(conn, error);
  }

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  // acquireConnection(client, config, txid) {
  //   const configConnection = config && config.connection;
  //   return Promise.try(() => configConnection || client.acquireRawConnection())
  //     .then(function(connection) {
  //       connection.__knexTxId = txid;

  //       return connection;
  //     })
  //     .disposer(function(connection) {
  //       if (!configConnection) {
  //         debug("%s: releasing connection", txid);
  //         client.releaseConnection(connection);
  //       } else {
  //         debug("%s: not releasing external connection", txid);
  //       }
  //     });
  // }

  // rollbackTo(conn, error) {
  //   // debug('%s: rolling backTo', this.txid)
  //   // return Promise.resolve()
  //   //   .then(() => this.query(conn, `ROLLBACK TRANSACTION ${this.txid}`, 2, error))
  //   //   .then(() => this._rejecter(error))
  // }
}

module.exports = Transaction_MSSQL;

function nameToIsolationLevelEnum(level) {
  if (!level) return;
  level = level.toUpperCase().replace(' ', '_');
  const knownEnum = isolationEnum[level];
  if (!knownEnum) {
    throw new Error(
      `Unknown Isolation level, was expecting one of: ${JSON.stringify(
        humanReadableKeys
      )}`
    );
  }
  return knownEnum;
}

// Based on: https://github.com/tediousjs/node-mssql/blob/master/lib/isolationlevel.js
const isolationEnum = {
  READ_UNCOMMITTED: 0x01,
  READ_COMMITTED: 0x02,
  REPEATABLE_READ: 0x03,
  SERIALIZABLE: 0x04,
  SNAPSHOT: 0x05,
};
const humanReadableKeys = Object.keys(isolationEnum).map((key) =>
  key.toLowerCase().replace('_', ' ')
);
