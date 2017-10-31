import Promise from 'bluebird';
import Transaction from '../../transaction';
const debug = require('debug')('knex:tx')

export default class Transaction_DB2 extends Transaction {

  begin(conn) {
    debug('%s: begin', this.txid);
    return conn.beginTransactionAsync()
      .then(this._resolver)
      .catch(this._rejecter)
  }

  commit(conn, value) {
    this._completed = true;
    debug('%s: commit', this.txid);
    return conn.commitTransactionAsync()
      .then(() => this._resolver(value))
      .catch(this._rejecter);
  }

  release(conn, value) {
    const rollback = false;
    return conn.endTransactionAsync(rollback);
  }

  rollback(conn, error) {
    this._completed = true
    debug('%s: rolling back', this.txid)
    return conn.rollbackTransactionAsync()
      .then(() => this._rejecter(error));
  }

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection(config) {
    const t = this
    const configConnection = config && config.connection
    return Promise.try(() => {
      return (t.outerTx ? t.outerTx.conn : null) ||
        configConnection ||
        t.client.acquireConnection();
    }).tap(function(conn) {
      if (!t.outerTx) {
        t.conn = conn
        // no transaction data structure in ibm_db        
        conn.tx_ = conn
      }
    }).disposer(function(conn) {
      if (t.outerTx) return;
      if (conn.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid)
          conn.tx_.rollbackTransactionAsync();
        }
        conn.tx_ = null;
      }
      t.conn = null
      if (!configConnection) {
        debug('%s: releasing connection', t.txid)
        t.client.releaseConnection(conn)
      } else {
        debug('%s: not releasing external connection', t.txid)
      }
    })
  }
}