const Bluebird = require('bluebird');
const Transaction = require('../../transaction');
const { isUndefined } = require('lodash');
const debugTx = require('debug')('knex:tx');

module.exports = class Oracle_Transaction extends Transaction {
  // disable autocommit to allow correct behavior (default is true)
  begin() {
    return Bluebird.resolve();
  }

  commit(conn, value) {
    this._completed = true;
    return conn
      .commitAsync()
      .then(() => value)
      .then(this._resolver, this._rejecter);
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn
      .rollbackAsync()
      .throw(err)
      .catch((error) => {
        if (isUndefined(error)) {
          if (this.doNotRejectOnRollback) {
            this._resolver();
            return;
          }
          error = new Error(`Transaction rejected with non-error: ${error}`);
        }

        return this._rejecter(error);
      });
  }

  acquireConnection(config, cb) {
    const configConnection = config && config.connection;
    return new Bluebird((resolve, reject) => {
      try {
        resolve(configConnection || this.client.acquireConnection());
      } catch (e) {
        reject(e);
      }
    })
      .then((connection) => {
        connection.__knexTxId = this.txid;

        return connection;
      })
      .then((connection) => {
        if (!this.outerTx) {
          connection.setAutoCommit(false);
        }
        return connection;
      })
      .then(async (connection) => {
        try {
          return await cb(connection);
        } finally {
          debugTx('%s: releasing connection', this.txid);
          connection.setAutoCommit(true);
          if (!configConnection) {
            this.client.releaseConnection(connection);
          } else {
            debugTx('%s: not releasing external connection', this.txid);
          }
        }
      });
  }
};
