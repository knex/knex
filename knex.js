//     Knex.js  0.4.0

//     (c) 2013 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org
(function(define) {

"use strict";

define(function(require, exports, module) {

  var _          = require('underscore');
  var when       = require('when');

  var Raw         = require('./lib/raw').Raw;
  var Transaction = require('./lib/transaction').Transaction;
  var Builder     = require('./lib/builder').Builder;
  var Interface   = require('./lib/builder/interface').Interface;
  var Schema      = require('./lib/schema').Schema;
  var ClientBase  = require('./clients/clientbase').ClientBase;

  // The `Knex` module, taking either a fully initialized
  // database client, or a configuration to initialize one. This is something
  // you'll typically only want to call once per application cycle.
  var Knex = function(client) {

    // If the client isn't actually a client, we need to configure it into one.
    // On the client, this isn't acceptable, since we need to return immediately
    // rather than wait on an async load of a client library.
    if (!client instanceof ClientBase) {
      if (typeof define === 'function' && define.amd) {
        throw new Error('A valid `Knex` client must be passed into the Knex constructor.');
      } else  {
        var clientName = client.client;
        if (!Clients[clientName]) {
          throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
        }
        var ClientCtor = require(Clients[clientName]);
        client = new ClientCtor(_.omit(options, 'client'));
      }
    }

    // Enables the `Knex('tableName')` shorthand syntax.
    var instance = function(tableName) {
      return instance.builder(tableName);
    };

    // Main namespaces for key library components.
    instance.schema  = {};
    instance.migrate = {};

    // Enable the `Builder('tableName')` syntax, as is used in the main `Knex('tableName')`.
    instance.builder = function(tableName) {
      var builder = new Builder(instance);
      return tableName ? builder.table(tableName) : builder;
    };

    // Attach each of the `Builder` "interface" methods direcly onto
    // the `Knex` object, for ease of use when creating a new query builder chain:
    // `Knex.select('*').from('tableName').then(...`
    // `Knex.insert(values).into('tableName').then(...`
    // `Knex.update(values).then(...`
    _.each(Interface, function(val, key) {
      instance[key] = function() {
        var builder = new Builder(instance);
        return builder[key].apply(builder, arguments);
      };
    });

    // Attach each of the `Schema` "interface" methods directly onto to `Knex.Schema` namespace:
    // `Knex.Schema.table('tableName', function() {...`
    // `Knex.Schema.createTable('tableName', function() {...`
    // `Knex.Schema.dropTableIfExists('tableName');`
    _.each(SchemaInterface, function(val, key) {
      instance.schema[key] = function() {
        var schemaBuilder = new SchemaBuilder(instance);
        schemaBuilder.table = _.first(arguments);
        return schemaBuilder[key].apply(schemaBuilder, _.rest(arguments));
      };
    });

    // Attach each of the `Migrate` "interface" methods directly on to
    _.each(MigrateInterface, function(val, key) {
      instance.migrate[key] = function() {
        var migrateBuilder = new MigrateBuilder(instance);
        return MigrateBuilder[key].apply(migrateBuilder, arguments);
      };
    });

    // Method to run a new `Raw` query on the current client.
    instance.raw = function() {
      var raw = new Raw(instance);
      return raw.query.apply(raw, arguments);
    };

    // Keep a reference to the current client.
    instance.client = client;

    // Keep in sync with package.json
    instance.VERSION = '0.5.0';

    // Runs a new transaction, taking a container and
    instance.transaction = function(container) {
      var transaction = new Transaction(instance);
      return transaction.run(container);
    };

    // Return the new Knex instance.
    return instance;
  };

  var Clients = Knex.Clients = {
    'mysql'    : './clients/mysql.js',
    'pg'       : './clients/postgres.js',
    'postgres' : './clients/postgres.js',
    'sqlite'   : './clients/sqlite3.js',
    'sqlite3'  : './clients/sqlite3.js'
  };

  // Used primarily to type-check a potential `Knex` client in `Bookshelf.js`,
  // by examining whether the object's `client` is an `instanceof Knex.ClientBase`.
  Knex.ClientBase = ClientBase;

  // finally, export the `Knex` object for node and the browser.
  module.exports = Knex;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);