
var Transaction = require('../../transaction')
var assign      = require('lodash/object/assign');

function Oracle_Transaction(client, outerTx) {
  Transaction.call(this, client, outerTx)
}

assign(Oracle_Transaction.prototype, {

  // disable autocommit to allow correct behavior (default is true)
  beginTransaction: function(conn) {
    return Promise.resolve()
  },

  commit: function(conn, value) {
    return Promise.promisify(conn.commit.bind(conn))
      .return(value)
      .then(this._resolver, this._rejecter)
  },

  rollback: function(conn, err) {
    return Promise.promisify(conn.rollback.bind(conn))
      .throw(err)
      .then(this._resolver, this._rejecter)
  },

  acquireConnection: function(config) {
    var t = this
    return Promise.try(function() {
      return config.connection || t.client.acquireConnection()  
    }).tap(function(connection) {
      if (!t._outerTx) {
        return conn.setAutoCommit(false)  
      }
    }).disposer(function(connection) {
      if (!config.connection) {
        t.client.releaseConnection(connection)
      } else {
        debugTx('%s: not releasing external connection', t.txid)
      }
    })
  }

})

module.exports = Oracle_Transaction
