'use strict';

// Knex.js  0.8.0
// --------------
//     (c) 2014 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

var EventEmitter   = require('events').EventEmitter;
var Raw            = require('./lib/raw');
var warn           = require('./lib/helpers').warn
var QueryInterface = require('./lib/query/methods');
var Client         = require('./lib/client')
var assign         = require('lodash/object/assign')

function Knex(config) {
  if (typeof config === 'string') {
    return new Knex(assign(parseUrl(config), arguments[2]))
  }
  if (arguments.length === 0 || !config.client) {
    return makeKnex(new Client({}))
  }
  var clientName = config.client || config.dialect;
  var Dialect    = require('./lib/dialects/' + (aliases[clientName] || clientName))

  return makeKnex(new Dialect(config))
}

function makeKnex(client) {

  // The object we're potentially using to kick off an initial chain.
  function knex(tableName) {
    var qb = knex.queryBuilder();
    if (!tableName) {
      warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.')
    }
    return tableName ? qb.table(tableName) : qb;
  }

  assign(knex, {
    
    // A new query builder instance
    queryBuilder: function() {
      return client.queryBuilder()
    },

    raw: function() {
      return client.raw.apply(client, arguments);
    },

    // Runs a new transaction, taking a container and returning a promise
    // for when the transaction is resolved.
    transaction: function(container) {
      return client.transaction(container);
    },

    // Typically never needed, initializes the pool for a knex client.
    initialize: function(config) {
      return client.initialize(config)
    },

    // Convenience method for tearing down the pool.
    destroy: function(callback) {
      return client.destroy(callback);
    }

  })

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__  = '0.8.0';

  // Hook up the "knex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  QueryInterface.forEach(function(method) {
    knex[method] = function() {
      var builder = knex.queryBuilder();
      return builder[method].apply(builder, arguments);
    }
  })
  
  knex.client = client;

  Object.defineProperties(knex, {

    schema: {
      get: function() {
        return client.schemaBuilder();
      }
    },

    migrate: {
      get: function() {
        return new Migrator(knex);
      }
    },

    seed: {
      get: function() {
        return new Seeder(knex);
      }
    },

    fn: {
      get: function() {
        return new FunctionHelper(client);
      }
    }

  });

  // Passthrough all "start" and "query" events to the knex object.
  client.on('start', function(obj) {
    knex.emit('start', obj);
  })
  
  client.on('query', function(obj) {
    knex.emit('query', obj);
  })

  client.makeKnex = function(client) {
    return makeKnex(client)
  }

  return knex;
}

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function(sql, bindings) {
  return new Raw({}).set(sql, bindings);
}

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  warn('knex.initialize is deprecated, pass your config object directly to the knex module')
  return new Knex(config)
}

function parseUrl() {

}

// The client names we'll allow in the `{name: lib}` pairing.
var aliases = {
  'mariadb'       : 'maria',
  'mariasql'      : 'maria',
  'pg'            : 'postgres',
  'sqlite'        : 'sqlite3',
};

module.exports = Knex;
