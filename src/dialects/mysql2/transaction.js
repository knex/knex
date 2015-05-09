
var Transaction = require('../../transaction')
var assign      = require('lodash/object/assign');
var inherits    = require('inherits')
var debug       = require('debug')('knex:tx')
var helpers     = require('../../helpers')

function Transaction_MySQL2() {
  Transaction.apply(this, arguments)
}
inherits(Transaction_MySQL2, Transaction)

assign(Transaction_MySQL2.prototype, {

  query: function(conn, sql, status, value) {
    var t = this
    var q = this.trxClient.query(conn, sql)
      .catch(function(err) {
        return err.code === 'ER_SP_DOES_NOT_EXIST'
      }, function() {
        helpers.warn('Transaction was implicitly committed, do not mix transactions and DDL with MySQL (#805)')
      })
      .catch(function(err) {
        status = 2
        value  = err
        t._completed = true
        debug('%s error running transaction query', t.txid)
      })
      .tap(function() {
        if (status === 1) t._resolver(value)
        if (status === 2) t._rejecter(value)
      })
    if (status === 1 || status === 2) {
      t._completed = true
    }
    return q;
  }

})

module.exports = Transaction_MySQL2
