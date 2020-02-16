const { isUndefined } = require('lodash');

const Bluebird = require('bluebird');
const Transaction = require('../../transaction');
const { timeout, KnexTimeoutError } = require('../../util/timeout');
const debugTx = require('debug')('knex:tx');

module.exports = class Oracle_Transaction extends Transaction {
  // disable autocommit to allow correct behavior (default is true)
  begin() {
    return Bluebird.resolve();
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

  acquireConnection(config, cb) {
    const configConnection = config && config.connection;
    const t = this;
    return new Bluebird((resolve, reject) => {
      try {
        this.client
          .acquireConnection()
          .then((cnx) => {
            cnx.__knexTxId = this.txid;
            cnx.isTransaction = true;
            resolve(cnx);
          })
          .catch(reject);
      } catch (e) {
        reject(e);
      }
    }).then(async (connection) => {
      try {
        return await cb(connection);
      } finally {
        debugTx('%s: releasing connection', this.txid);
        connection.isTransaction = false;
        try {
          await connection.commitAsync();
        } catch (err) {
          t._rejecter(err);
        } finally {
          if (!configConnection) {
            await t.client.releaseConnection(connection);
          } else {
            debugTx('%s: not releasing external connection', t.txid);
          }
        }
      }
    });
  }
};
