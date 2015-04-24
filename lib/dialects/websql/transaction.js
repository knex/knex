'use strict';

var makeKnex = require('../../util/make-knex')
var Promise  = require('../../promise')
var inherits = require('inherits')
var assign   = require('lodash/object/assign');

function Transaction_WebSQL(client, container, config, outerTx) {
  this._promise = Promise.try(function() {
    container(makeKnex(client))
  })
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
