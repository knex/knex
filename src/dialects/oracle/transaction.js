
import Promise from 'bluebird';
import Transaction from '../../transaction';
const debugTx = require('debug')('knex:tx')

export default class Oracle_Transaction extends Transaction {

  // disable autocommit to allow correct behavior (default is true)
  begin() {
    return Promise.resolve()
  }

  commit(conn, value) {
    this._completed = true
    return conn.commitAsync()
      .return(value)
      .then(this._resolver, this._rejecter)
  }

  release(conn, value) {
    return this._resolver(value)
  }

  rollback(conn, err) {
    this._completed = true
    debugTx('%s: rolling back', this.txid)
    return conn.rollbackAsync()
      .throw(err)
      .catch(this._rejecter)
  }

  acquireConnection(config) {
    const t = this
    return Promise.try(() =>
      config.connection || t.client.acquireConnection()
    ).tap(connection => {
      if (!t.outerTx) {
        connection.setAutoCommit(false)
      }
    }).disposer(connection => {
      debugTx('%s: releasing connection', t.txid)
      connection.setAutoCommit(true)
      if (!config.connection) {
        t.client.releaseConnection(connection)
      } else {
        debugTx('%s: not releasing external connection', t.txid)
      }
    })
  }

}
