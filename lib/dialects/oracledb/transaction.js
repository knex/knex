const { isUndefined } = require('lodash');

const Bluebird = require('bluebird');
const Transaction = require('../../transaction');
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
    const self = this;
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn
      .rollbackAsync()
      .timeout(5000)
      .catch(Bluebird.TimeoutError, function(e) {
        self._rejecter(e);
      })
      .then(function() {
        if (isUndefined(err)) {
          if (self.doNotRejectOnRollback) {
            self._resolver();
            return;
          }
          err = new Error(`Transaction rejected with non-error: ${err}`);
        }
        self._rejecter(err);
      });
  }

  savepoint(conn) {
    return this.query(conn, `SAVEPOINT ${this.txid}`);
  }

  async acquireConnection(config, cb) {
    const configConnection = config && config.connection;
    const connection = await this.client.acquireConnection();
    connection.__knexTxId = this.txid;
    connection.isTransaction = true;

    try {
      await cb(connection);
      connection.isTransaction = false;
      await connection.commitAsync();
    } finally {
      debugTx('%s: releasing connection', this.txid);
      if (!configConnection) {
        this.client.releaseConnection(connection);
      } else {
        debugTx('%s: not releasing external connection', this.txid);
      }
    }
  }
};
