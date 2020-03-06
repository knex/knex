const { isUndefined } = require('lodash');

const Transaction = require('../../transaction');
const { timeout, KnexTimeoutError } = require('../../util/timeout');
const debugTx = require('debug')('knex:tx');

module.exports = class Oracle_Transaction extends Transaction {
  // disable autocommit to allow correct behavior (default is true)
  begin() {
    return Promise.resolve();
  }

  async commit(conn, value) {
    this._completed = true;
    try {
      await conn.commitAsync();
      this._resolver(value);
    } catch (err) {
      this._rejecter(err);
    }
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return timeout(conn.rollbackAsync(), 5000)
      .catch((e) => {
        if (!(e instanceof KnexTimeoutError)) {
          return Promise.reject(e);
        }
        this._rejecter(e);
      })
      .then(() => {
        if (isUndefined(err)) {
          if (this.doNotRejectOnRollback) {
            this._resolver();
            return;
          }
          err = new Error(`Transaction rejected with non-error: ${err}`);
        }
        this._rejecter(err);
      });
  }

  savepoint(conn) {
    return this.query(conn, `SAVEPOINT ${this.txid}`);
  }

  async acquireConnection(connection, cb) {
    try {
      connection.isTransaction = true;
      return await cb(connection);
    } finally {
      debugTx('%s: releasing connection', this.txid);
      connection.isTransaction = false;
      try {
        await connection.commitAsync();
      } catch (err) {
        this._rejecter(err);
      }
    }
  }
};
