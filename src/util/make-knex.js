
var EventEmitter   = require('events').EventEmitter
var assign         = require('lodash/object/assign');

var Migrator       = require('../migrate')
var Seeder         = require('../seed')
var FunctionHelper = require('../functionhelper')
var QueryInterface = require('../query/methods')
var helpers        = require('../helpers')

module.exports = function makeKnex(client) {

  // The object we're potentially using to kick off an initial chain.
  function knex(tableName) {
    var qb = knex.queryBuilder()
    if (!tableName) {
      helpers.warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.')
    }
    return tableName ? qb.table(tableName) : qb
  }

  assign(knex, {

    Promise: require('../promise'),

    // A new query builder instance
    queryBuilder: function() {
      return client.queryBuilder()
    },

    raw: function() {
      return client.raw.apply(client, arguments)
    },

    // Runs a new transaction, taking a container and returning a promise
    // for when the transaction is resolved.
    transaction: function(container, config) {
      return client.transaction(container, config)
    },

    // Initializes the pool for a knex client. Not normally required. Returns a
    // promise, and may optionally be called with a callback.
    initialize: function(config, callback) {
      return client.initializePool(config, callback)
    },

    // Convenience method for tearing down the pool. Returns a promise, and may
    // optionally be called with a callback.
    destroy: function(callback) {
      return client.destroy(callback)
    }

  })

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__  = '0.8.6'

  // Hook up the "knex" object as an EventEmitter.
  var ee = new EventEmitter()
  for (var key in ee) {
    knex[key] = ee[key]
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  QueryInterface.forEach(function(method) {
    knex[method] = function() {
      var builder = knex.queryBuilder()
      return builder[method].apply(builder, arguments)
    }
  })

  knex.client = client

  Object.defineProperties(knex, {

    schema: {
      get: function() {
        return client.schemaBuilder()
      }
    },

    migrate: {
      get: function() {
        return new Migrator(knex)
      }
    },

    seed: {
      get: function() {
        return new Seeder(knex)
      }
    },

    fn: {
      get: function() {
        return new FunctionHelper(client)
      }
    }

  })

  // Passthrough all "start" and "query" events to the knex object.
  client.on('start', function(obj) {
    knex.emit('start', obj)
  })

  client.on('query', function(obj) {
    knex.emit('query', obj)
  })

  client.makeKnex = function(client) {
    return makeKnex(client)
  }

  return knex
}
