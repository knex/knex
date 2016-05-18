
import makeKnex from '../../util/make-knex';
import Promise from '../../promise';
import * as helpers from '../../helpers';
import inherits from 'inherits';
import { EventEmitter } from 'events';

function Transaction_WebSQL(client, container) {
  helpers.warn('WebSQL transactions will run queries, but do not commit or rollback')
  const trx = this
  this._promise = Promise.try(function() {
    container(makeKnex(makeClient(trx, client)))
  })
}
inherits(Transaction_WebSQL, EventEmitter)

function makeClient(trx, client) {

  const trxClient = Object.create(client.constructor.prototype)
  trxClient.config = client.config
  trxClient.connectionSettings = client.connectionSettings
  trxClient.transacting = true

  trxClient.on('query', function(arg) {
    trx.emit('query', arg)
    client.emit('query', arg)
  })
  trxClient.commit = function() {}
  trxClient.rollback = function() {}

  return trxClient
}

const promiseInterface = [
  'then', 'bind', 'catch', 'finally', 'asCallback',
  'spread', 'map', 'reduce', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'exec', 'reflect'
]

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
promiseInterface.forEach(function(method) {
  Transaction_WebSQL.prototype[method] = function() {
    return (this._promise = this._promise[method].apply(this._promise, arguments))
  }
})

export default Transaction_WebSQL
