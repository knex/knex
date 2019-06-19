const Bluebird = require('bluebird');
const Transaction = require('../../transaction');
const { isUndefined } = require('lodash');
const debug = require('debug')('knex:tx');

module.exports = class Transaction_MSSQL extends Transaction {
  begin(conn) {
    debug('%s: begin', this.txid);
    return conn.tx_.begin().then(this._resolver, this._rejecter);
  }

  savepoint(conn) {
    debug('%s: savepoint at', this.txid);
    return Bluebird.resolve().then(() =>
      this.query(conn, `SAVE TRANSACTION ${this.txid}`)
    );
  }

  commit(conn, value) {
    this._completed = true;
    debug('%s: commit', this.txid);
    return conn.tx_.commit().then(() => this._resolver(value), this._rejecter);
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, error) {
    this._completed = true;
    debug('%s: rolling back', this.txid);
    return conn.tx_.rollback().then(
      () => {
        let err = error;
        if (isUndefined(error)) {
          if (this.doNotRejectOnRollback) {
            this._resolver();
            return;
          }
          err = new Error(`Transaction rejected with non-error: ${error}`);
        }
        this._rejecter(err);
      },
      (err) => {
        if (error) err.originalError = error;
        return this._rejecter(err);
      }
    );
  }

  rollbackTo(conn, error) {
    debug('%s: rolling backTo', this.txid);
    return Bluebird.resolve()
      .then(() =>
        this.query(conn, `ROLLBACK TRANSACTION ${this.txid}`, 2, error)
      )
      .then(() => this._rejecter(error));
  }

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection(config) {
    const t = this;
    const configConnection = config && config.connection;
    return new Bluebird((resolve, reject) => {
      try {
        resolve(
          (t.outerTx ? t.outerTx.conn : null) ||
            configConnection ||
            t.client.acquireConnection()
        );
      } catch (e) {
        reject(e);
      }
    })
      .then(function(conn) {
        conn.__knexTxId = t.txid;
        if (!t.outerTx) {
          t.conn = conn;
          conn.tx_ = conn.transaction();
        }
        return conn;
      })
      .disposer(function(conn) {
        if (t.outerTx) return;
        if (conn.tx_) {
          if (!t._completed) {
            debug('%s: unreleased transaction', t.txid);
            conn.tx_.rollback();
          }
          conn.tx_ = null;
        }
        t.conn = null;
        if (!configConnection) {
          debug('%s: releasing connection', t.txid);
          t.client.releaseConnection(conn);
        } else {
          debug('%s: not releasing external connection', t.txid);
        }
      });
  }
};
