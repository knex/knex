import Promise from "bluebird";
import Transaction from "../../transaction";
const debug = require("debug")("knex:tx");

export default class Transaction_MSSQL extends Transaction {
  begin(conn) {
    debug("transaction::begin id=%s", this.txid);

    return this.query(conn, 'BEGIN TRANSACTION');

    // return Promise.resolve()
      // .then(() => this.query(conn, `BEGIN TRANSACTION`))
      // .then(this._resolver, this._rejecter);

    // return new Promise((resolve, reject) => {
    //   conn.beginTransaction(err => {
    //     if (err) {
    //       debug(
    //         "transaction::begin error id=%s message=%s",
    //         this.txid,
    //         err.message
    //       );
    //       return reject(err);
    //     }
    //     resolve();
    //   });
    // }, this.txid).then(this._resolver, this._rejecter);

  }

  savepoint(conn) {
    debug("transaction::savepoint id=%s", this.txid);

    return this.query(conn, 'SAVE TRANSACTION');

    // return new Promise((resolve, reject) => {
    //   conn.saveTransaction(err => {
    //     if (err) {
    //       debug(
    //         "transaction::savepoint id=%s message=%s",
    //         this.txid,
    //         err.message
    //       );
    //       return reject(err);
    //     }

    //     resolve();
    //   });
    // });
  }

  commit(conn, value) {
    debug("transaction::commit id=%s", this.txid);

    return this.query(conn, 'COMMIT TRANSACTION', 1, value);

    // return Promise.resolve()
    //   // .then(() => this.query(conn, `COMMIT TRANSACTION`))
    //   .then(() => this._resolver(value), this._rejecter);

    // return new Promise((resolve, reject) => {
    //   conn.commitTransaction(err => {
    //     if (err) {
    //       debug(
    //         "transaction::commit error id=%s message=%s",
    //         this.txid,
    //         err.message
    //       );
    //       return reject(err);
    //     }

    //     this._completed = true;
    //     resolve(value);
    //   }, this.txid);
    // }).then(() => this._resolver(value), this._rejecter);
  }

  // release(conn, value) {
  //   return this._resolver(value)
  // }

  rollback(conn, error) {
    // this._completed = true;
    debug("transaction::rollback id=%s", this.txid);

    return this.query(conn, 'ROLLBACK TRANSACTION', 2, error);

    // return Promise.resolve()
    //   .then(() => this.query(conn, `ROLLBACK TRANSACTION`))
    //   .then(() => this._rejecter(error), err => this._rejecter(err));

    // return new Promise((resolve, reject) => {
    //   conn
    //     .rollbackTransaction(err => {
    //       if (err) {
    //         debug(
    //           "transaction::rollback error id=%s message=%s",
    //           this.txid,
    //           err.message
    //         );
    //         err.originalError = err;
    //       }

    //       return this._rejecter(error);
    //     }, this.txid)
    //     .catch(this._rejecter);
    // });
  }

  // rollbackTo(conn, error) {
  //   // debug('%s: rolling backTo', this.txid)
  //   // return Promise.resolve()
  //   //   .then(() => this.query(conn, `ROLLBACK TRANSACTION ${this.txid}`, 2, error))
  //   //   .then(() => this._rejecter(error))
  // }

  acquireConnection(client, config, txid) {
    return client
      .acquireConnection()
      .tap(connection => {
        connection.__knexTxId = txid;
      });
  }

  // acquireConnection(config) {
  //   const t = this;
  //   const configConnection = config && config.connection;
  //   return Promise.try(() => {
  //     return (
  //       (t.outerTx ? t.outerTx.conn : null) ||
  //       configConnection ||
  //       t.client.acquireConnection()
  //     );
  //   })
  //     .tap(function(conn) {
  //       if (!t.outerTx) {
  //         t.conn = conn;
  //         conn.tx_ = conn; // conn.transaction();
  //       }
  //     })
  //     .disposer(function(conn) {
  //       if (t.outerTx) return;
  //       if (conn.tx_) {
  //         if (!t._completed) {
  //           debug("%s: unreleased transaction", t.txid);
  //           // conn.tx_.rollback();
  //         }
  //         conn.tx_ = null;
  //       }
  //       t.conn = null;
  //       if (!configConnection) {
  //         debug("%s: releasing connection", t.txid);
  //         t.client.releaseConnection(conn);
  //       } else {
  //         debug("%s: not releasing external connection", t.txid);
  //       }
  //     });
  // }
}
