
var Transaction = require('../../transaction')
var assign      = require('lodash/object/assign');
var inherits    = require('inherits')
var debug       = require('debug')('knex:tx')
var helpers     = require('../../helpers')

function Transaction_Firebird() {
  Transaction.apply(this, arguments)
}
inherits(Transaction_Firebird, Transaction)

assign(Transaction_Firebird.prototype, {
  isCompleted: function() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || false
  },

  begin: function(conn) {
    return this.query(conn, '')
  },

  savepoint: function(conn) {
    return this.query(conn, ' ' )
  },

  commit: function(conn, value) {
    return this.query(conn, ' ' )
  },

  release: function(conn, value) {
    return this.query(conn, ' ' )
  },

  rollback: function(conn, error) {
    return this.query(conn, ' ' )
  },

  rollbackTo: function(conn, error) {
    return this.query(conn, ' ' )
  },

  query: function(conn, sql, status, value) {
      
      //console.log(sql);
      //console.log(status);
      console.log(this.trxClient._events);
      
    var q = this.trxClient.query(conn, sql)
      .catch((err) => {
        status = 2
        value  = err
        this._completed = true
        debug('%s error running transaction query', this.txid)
      })
      .tap(() => {
        if (status === 1) this._resolver(value)
        if (status === 2) this._rejecter(value)
      })
    if (status === 1 || status === 2) {
      this._completed = true
    }
    return q;
  }
})

module.exports = Transaction_Firebird
