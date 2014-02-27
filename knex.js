// Knex.js  0.5.8
// --------------

//     (c) 2013 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// Base library dependencies of the app.
var _ = require('lodash');

// Require the main constructors necessary for a `Knex` instance,
// each of which are injected with the current instance, so they maintain
// the correct client reference & grammar.
var Raw         = require('./lib/raw').Raw;
var Transaction = require('./lib/transaction').Transaction;
var Builder     = require('./lib/builder').Builder;
var Promise     = require('./lib/promise').Promise;

var ClientBase       = require('./clients/base').ClientBase;
var SchemaBuilder    = require('./lib/schemabuilder').SchemaBuilder;
var SchemaInterface  = require('./lib/schemainterface').SchemaInterface;

// The `Knex` module, taking either a fully initialized
// database client, or a configuration to initialize one. This is something
// you'll typically only want to call once per application cycle.
var Knex = function(config) {

  var Dialect, client;

  // If the client isn't actually a client, we need to configure it into one.
  // On the client, this isn't acceptable, since we need to return immediately
  // rather than wait on an async load of a client library.
  if (config instanceof ClientBase) {
    client = config;
  } else {
    if (typeof define === 'function' && define.amd) {
      throw new Error('A valid `Knex` client must be passed into the Knex constructor.');
    } else  {
      var clientName = config.client;
      if (!Clients[clientName]) {
        throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
      }
      Dialect = require(Clients[clientName]);
      client = new Dialect.Client(_.omit(config, 'client'));
    }
  }

  // Enables the `knex('tableName')` shorthand syntax.
  var knex = function(tableName) {
    return knex.builder(tableName);
  };

  knex.grammar       = client.grammar;
  knex.schemaGrammar = client.schemaGrammar;

  // Main namespaces for key library components.
  knex.schema  = {};
  knex.migrate = {};

  // Enable the `Builder('tableName')` syntax, as is used in the main `knex('tableName')`.
  knex.builder = function(tableName) {
    var builder = new Builder(knex);
    return tableName ? builder.from(tableName) : builder;
  };

  // Attach each of the `Schema` "interface" methods directly onto to `knex.schema` namespace, e.g.:
  // `knex.schema.table('tableName', function() {...`
  // `knex.schema.createTable('tableName', function() {...`
  // `knex.schema.dropTableIfExists('tableName');`
  _.each(SchemaInterface, function(val, key) {
    knex.schema[key] = function() {
      var schemaBuilder = new SchemaBuilder(knex);
      var table = schemaBuilder.table = _.first(arguments);
      if (!table) {
        return Promise.reject(new Error('The table must be defined for the ' + key + ' method.'));
      }
      return SchemaInterface[key].apply(schemaBuilder, _.rest(arguments));
    };
  });

  // Method to run a new `Raw` query on the current client.
  knex.raw = function(sql, bindings) {
    return new Raw(knex).query(sql, bindings);
  };

  // Keep a reference to the current client.
  knex.client = client;

  // Keep in sync with package.json
  knex.VERSION = '0.5.8';

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  knex.transaction = function(container) {
    return new Transaction(knex).run(container);
  };

  // Attach each of the `Migrate` "interface" methods directly onto to `knex.migrate` namespace, e.g.:
  // knex.migrate.latest().then(...
  // knex.migrate.currentVersion(...
  _.each(['make', 'latest', 'rollback', 'currentVersion'], function(method) {
    knex.migrate[method] = function() {
      var Migrate   = require('./lib/migrate');
      var migration = new Migrate(knex);
      return migration[method].apply(migration, arguments);
    };
  });

  // Return the new `Knex` instance.
  return knex;
};

// The client names we'll allow in the `{name: lib}` pairing.
var Clients = Knex.Clients = {
  'mysql'      : './clients/server/mysql.js',
  'pg'         : './clients/server/postgres.js',
  'postgres'   : './clients/server/postgres.js',
  'postgresql' : './clients/server/postgres.js',
  'sqlite'     : './clients/server/sqlite3.js',
  'sqlite3'    : './clients/server/sqlite3.js'
};

// Used primarily to type-check a potential `Knex` client in `Bookshelf.js`,
// by examining whether the object's `client` is an `instanceof Knex.ClientBase`.
Knex.ClientBase = ClientBase;

// finally, export the `Knex` object for node and the browser.
module.exports = Knex;

Knex.initialize = function(config) {
  return Knex(config);
};