
var inherits    = require('inherits')
var assign      = require('lodash/object/assign');
var Promise     = require('../../promise')
var Transaction = require('../../transaction')
var debug       = require('debug')('knex:tx')

function Transaction_MSSQL() {
  Transaction.apply(this, arguments)
}
inherits(Transaction_MSSQL, Transaction)

assign(Transaction_MSSQL.prototype, {

  begin: function(conn) {
    debug('%s: begin', this.txid)
    return conn.tx_.begin()
      .then(this._resolver, this._rejecter)
  },

  savepoint: function(conn) {
    debug('%s: savepoint at', this.txid)
    return Promise.resolve()
      .then(() => this.query(conn, 'SAVE TRANSACTION ' + this.txid))
  },

  commit: function(conn, value) {
    this._completed = true
    debug('%s: commit', this.txid)
    return conn.tx_.commit()
      .then(() => this._resolver(value), this._rejecter)
  },

  release: function(conn, value) {
    return this._resolver(value)
  },

  rollback: function(conn, error) {
    this._completed = true
    debug('%s: rolling back', this.txid)
    return conn.tx_.rollback()
      .then(() => this._rejecter(error))
  },

  rollbackTo: function(conn, error) {
    debug('%s: rolling backTo', this.txid)
    return Promise.resolve()
      .then(() => this.query(conn, 'ROLLBACK TRANSACTION ' + this.txid, 2, error))
      .then(() => this._rejecter(error))
  },

  // Acquire a connection and create a disposer - either using the one passed 
  // via config or getting one off the client. The disposer will be called once 
  // the original promise is marked completed.
  acquireConnection: function(config) {
    var t = this
    var configConnection = config && config.connection
    return Promise.try(function() {
      return (t.outerTx ? t.outerTx.conn : null) || configConnection || t.client.acquireConnection()  
    }).tap(function(conn) {
      if (!t.outerTx) {
        t.conn = conn 
        conn.tx_ = conn.transaction()
      }
    }).disposer(function(conn) {
      if (t.outerTx) return;
      if (conn.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid)
          conn.tx_.rollback();
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
  
})

module.exports = Transaction_MSSQL
