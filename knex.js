// Knex.js  0.7.0
// --------------

'use strict';

//     (c) 2014 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// The "Knex" object we're exporting is just a passthrough to `Knex.initialize`.
function Knex() {
  return Knex.initialize.apply(null, arguments);
}

// Require the main constructors necessary for a `Knex` instance,
// each of which are injected with the current instance, so they maintain
// the correct client reference & grammar.
var Raw = require('./lib/raw');

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function(sql, bindings) {
  return new Raw(sql, bindings);
};

// Doing it this way makes it easier to build for browserify.
var mysql = function() { return require('./lib/dialects/mysql'); };
var mysql2 = function() { return require('./lib/dialects/mysql2'); };
var maria = function() { return require('./lib/dialects/maria'); };
var oracle = function() { return require('./lib/dialects/oracle'); };
var pg = function() { return require('./lib/dialects/postgres'); };
var sqlite3 = function() { return require('./lib/dialects/sqlite3'); };
var websql = function() { return require('./lib/dialects/websql'); };

// The client names we'll allow in the `{name: lib}` pairing.
var Clients = Knex.Clients = {
  'mysql'      : mysql,
  'mysql2'     : mysql2,
  'maria'      : maria,
  'mariadb'    : maria,
  'mariasql'   : maria,
  'oracle'     : oracle,
  'pg'         : pg,
  'postgres'   : pg,
  'postgresql' : pg,
  'sqlite'     : sqlite3,
  'sqlite3'    : sqlite3,
  'websql'     : websql
};

// Each of the methods which may be statically chained from knex.
var QueryInterface   = require('./lib/query/methods');

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  var Dialect, client;
  var EventEmitter = require('events').EventEmitter;

  // The object we're potentially using to kick off an
  // initial chain. It is assumed that `knex` isn't a
  // constructor, so we have no reference to 'this' just
  // in case it's called with `new`.
  function knex(tableName) {
    var qb = new client.QueryBuilder();
    if (config.__transactor__) qb.transacting(config.__transactor__);
    return tableName ? qb.table(tableName) : qb;
  }

  // Hook up the "knex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__  = '0.7.0';
  knex.raw = function(sql, bindings) {
    var raw = new client.Raw(sql, bindings);
    if (config.__transactor__) raw.transacting(config.__transactor__);
    return raw;
  };

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  knex.transaction = function(container) {
    return new client.Transaction(container);
  };

  // Convenience method for tearing down the pool.
  knex.destroy = function (callback) {
    return this.client.destroy(callback);
  };

  if (config.__client__) {
    client = config.__client__;
  } else {

    // Build the "client"
    var clientName = config.client || config.dialect;
    if (!Clients[clientName]) {
      throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
    }
    knex.toString = function() {
      return '[object Knex:' + clientName + ']';
    };
    Dialect = Clients[clientName]();
    client  = new Dialect(config);

    // Passthrough all "start" and "query" events to the knex object.
    client.on('start', function(obj) {
      knex.emit('start', obj);
    });
    client.on('query', function(obj) {
      knex.emit('query', obj);
    });
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  QueryInterface.forEach(function(method) {
    knex[method] = function() {
      var builder = knex();
      return builder[method].apply(builder, arguments);
    };
  });
  knex.client = client;

  Object.defineProperties(knex, {

    // Lazy-load / return a "schema" builder object, ensuring it's context-aware.
    schema: {
      get: function() {
        if (!client.SchemaBuilder) client.initSchema();
        var builder = new client.SchemaBuilder();
        if (config.__transactor__) builder.transacting(config.__transactor__);
        return builder;
      }
    },

    // Lazy-load / return a `Migrator` object.
    migrate: {
      get: function() {
        if (!client.Migrator) client.initMigrator();
        return new client.Migrator(knex);
      }
    },

    // Lazy-load / return a `Seeder` object.
    seed: {
      get: function() {
        if (!client.Seeder) client.initSeeder();
        return new client.Seeder(knex);
      }
    },

    // Lazy-load / return a `FunctionHelper` object.
    fn: {
      get: function() {
        if (!client.FunctionHelper) client.initFunctionHelper();
        return client.FunctionHelper;
      }
    }
  });

  return knex;
};

module.exports = Knex;
