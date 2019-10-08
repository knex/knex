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
      .return(value)
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

  acquireConnection(config) {
    const t = this;
    return new Bluebird(function(resolve, reject) {
      try {
        t.client
          .acquireConnection()
          .then(function(cnx) {
            cnx.__knexTxId = t.txid;
            cnx.isTransaction = true;
            resolve(cnx);
          })
          .catch(reject);
      } catch (e) {
        reject(e);
      }
    }).disposer(function(connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.isTransaction = false;
      connection.commitAsync().then(function(err) {
        if (err) {
          this._rejecter(err);
        }
        if (!config.connection) {
          t.client.releaseConnection(connection);
        } else {
          debugTx('%s: not releasing external connection', t.txid);
        }
      });
    });
  }
};
