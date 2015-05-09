
var makeKnex = require('../../util/make-knex')
var Promise  = require('../../promise')
var helpers  = require('../../helpers')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

function Transaction_WebSQL(client, container) {
  helpers.warn('WebSQL transactions will run queries, but do not commit or rollback')
  var trx = this
  this._promise = Promise.try(function() {
    container(makeKnex(makeClient(trx, client)))
  })
}
inherits(Transaction_WebSQL, EventEmitter)

function makeClient(trx, client) {
  
  var trxClient                = Object.create(client.constructor.prototype)
  trxClient.config             = client.config
  trxClient.connectionSettings = client.connectionSettings
  trxClient.transacting        = true
  
  trxClient.on('query', function(arg) {
    trx.emit('query', arg)
  })
  trxClient.commit = function() {}
  trxClient.rollback = function() {}

  return trxClient  
}

var promiseInterface = [
  'then', 'bind', 'catch', 'finally', 'asCallback', 
  'spread', 'map', 'reduce', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'
]

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
promiseInterface.forEach(function(method) {
  Transaction_WebSQL.prototype[method] = function() {
    return (this._promise = this._promise[method].apply(this._promise, arguments))
  }
})

module.exports = Transaction_WebSQL
