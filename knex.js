// Knex.js  0.5.13
// --------------

//     (c) 2014 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// The "Knex" object we're exporting is just a passthrough to `Knex.initialize`.
function Knex() {
  return Knex.initialize.apply(null, arguments);
}

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function(sql, bindings) {
  return new Raw(sql, bindings);
};

// Require the main constructors necessary for a `Knex` instance,
// each of which are injected with the current instance, so they maintain
// the correct client reference & grammar.
var Raw = require('./lib/raw');

// The client names we'll allow in the `{name: lib}` pairing.
var Clients = Knex.Clients = {
  'mysql'      : './lib/dialects/mysql',
  'pg'         : './lib/dialects/postgres',
  'postgres'   : './lib/dialects/postgres',
  'postgresql' : './lib/dialects/postgres',
  'sqlite'     : './lib/dialects/sqlite3',
  'sqlite3'    : './lib/dialects/sqlite3',
  'websql'     : './lib/dialects/websql'
};

// Require lodash.
var _ = require('lodash');

// Each of the methods which may be statically chained from knex.
var QueryInterface = require('./lib/query/methods');

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  var Dialect, client;

  // The object we're potentially using to kick off an
  // initial chain. It is assumed that `knex` isn't a
  // constructor, so we have no reference to 'this' just
  // in case it's called with `new`.
  function knex(tableName) {
    var qb = new client.QueryBuilder;
    return tableName ? qb.table(tableName) : qb;
  }

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__  = '0.6.0';
  knex.raw = function(sql, bindings) {
    return new client.Raw(sql, bindings);
  };

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  knex.transaction = function(container) {
    return new client.Transaction(container);
  };

  // Build the "client"
  var clientName = config.client;
  if (!Clients[clientName]) {
    throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
  }
  Dialect = require(Clients[clientName]);
  client  = new Dialect(config);

  // Allow chaining methods from the root object, before
  // any other information is specified.
  _.each(QueryInterface, function(method) {
    if (method.charAt(0) === '_') return;
    knex[method] = function() {
      var builder = (this instanceof client.QueryBuilder) ? this : new client.QueryBuilder();
      return builder[method].apply(builder, arguments);
    };
  });
  knex.client = client;

  // Namespaces for additional library components.
  var schema  = knex.schema  = {};
  var migrate = knex.migrate = {};

  // Attach each of the `Schema` "interface" methods directly onto to `knex.schema` namespace, e.g.:
  // `knex.schema.table('tableName', function() {...`
  // `knex.schema.createTable('tableName', function() {...`
  // `knex.schema.dropTableIfExists('tableName');`
  _.each(['table', 'createTable', 'editTable', 'dropTable',
    'dropTableIfExists',  'renameTable', 'hasTable', 'hasColumn'], function(key) {
    schema[key] = function() {
      if (!client.SchemaBuilder) client.initSchema();
      var builder = new client.SchemaBuilder();
      return builder[key].apply(builder, arguments);
    };
  });

  // Attach each of the `Migrator` "interface" methods directly onto to `knex.migrate` namespace, e.g.:
  // knex.migrate.latest().then(...
  // knex.migrate.currentVersion(...
  _.each(['make', 'latest', 'rollback', 'currentVersion'], function(method) {
    migrate[method] = function(config) {
      if (!client.Migrator) client.initMigrator();
      var migrator = new client.Migrator(config);
      return migrator[method].apply(migrator, arguments);
    };
  });

  // Add a few additional misc utils.
  knex.utils = _.extend({}, require('./lib/utils'));

  return knex;
};

module.exports = Knex;