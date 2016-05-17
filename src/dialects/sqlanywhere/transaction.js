
var inherits    = require('inherits')
var Promise     = require('../../promise')
var Transaction = require('../../transaction')
var debugTx     = require('debug')('knex:tx')

import {assign} from 'lodash'

function Sqlanywhere_Transaction(client, container, config, outerTx) {
  Transaction.call(this, client, container, config, outerTx)
}
inherits(Sqlanywhere_Transaction, Transaction)

assign(Sqlanywhere_Transaction.prototype, {

  // disable autocommit to allow correct behavior (default is on)
  begin: function() {
    return Promise.resolve()
  },

  commit: function(conn, value) {
    this._completed = true
    return conn.commitAsync()
      .return(value)
      .then(this._resolver, this._rejecter)
  },

  release: function(conn, value) {
    return this._resolver(value)
  },

  rollback: function(conn, err) {
    this._completed = true
    debugTx('%s: rolling back', this.txid)
    return conn.rollbackAsync()
      .throw(err)
      .catch(this._rejecter)
  },

  acquireConnection: function(config) {
    var t = this
    return Promise.try(function() {
      return config.connection || t.client.acquireConnection()
    }).tap(function(connection) {
	if (!t.outerTx) {
          return connection.execAsync( "set temporary option auto_commit = 'off'" )
      }
    }).disposer(function(connection) {
      debugTx('%s: releasing connection', t.txid)
      if (!t.outerTx ) {
        return connection.execAsync( "set temporary option auto_commit = 'on'" ).then( function() {
          if (!config.connection) {
            t.client.releaseConnection(connection)
          } else {
            debugTx('%s: not releasing external connection', t.txid)
          }
        })
      }
    })
  }

})

module.exports = Sqlanywhere_Transaction
