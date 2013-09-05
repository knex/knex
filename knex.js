//     Knex.js  0.2.6
//
//     (c) 2013 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org
(function(define) {

"use strict";

define(function(require, exports, module) {

  // Required dependencies.
  var _       = require('underscore');
  var when    = require('when');
  var Common  = require('./lib/common').Common;
  var Helpers = require('./lib/helpers').Helpers;

  // `Knex` is the root namespace and a chainable function: `Knex('tableName')`
  var Knex = function(table) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return Knex.Instances['main'](table);
  };

  // Keep in sync with package.json
  Knex.VERSION    = '0.2.6';
  Knex.Builder    = require('./lib/builder').Builder;
  Knex.JoinClause = require('./lib/joinclause').JoinClause;

  // Knex.Transaction
  // ---------
  Knex.Transaction = function(container) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return transaction.call(Knex.Instances['main'], container);
  };

  var transaction = require('./lib/transaction').transaction;

  // Knex.Schema
  // ---------

  var initSchema = function(Target, client) {

    // Top level object for Schema related functions
    var Schema = Target.Schema = {};

    // Attach main static methods, which passthrough to the
    // SchemaBuilder instance methods
    _.each(['hasTable', 'hasColumn', 'createTable', 'table', 'dropTable', 'renameTable', 'dropTableIfExists'], function(method) {

      Schema[method] = function() {
        var args = _.toArray(arguments);
        var builder = new Knex.SchemaBuilder(args[0]);
            builder.client = client;
            builder.grammar = client.schemaGrammar;
        return SchemaInterface[method].apply(builder, args.slice(1));
      };
    });

  };

  // All of the Schame methods that should be called with a
  // `SchemaBuilder` context, to disallow calling more than one method at once.
  var SchemaInterface = require('./lib/schemainterface').SchemaInterface;

  // Knex.SchemaBuilder
  // --------
  Knex.SchemaBuilder = require('./lib/schemabuilder').SchemaBuilder;

  // Knex.Migrate
  // --------
  Knex.Migrate = require('./lib/migrate').Migrate;

  // Knex.Raw
  // -------

  // Helpful for injecting a snippet of raw SQL into a
  // `Knex` block... in most cases, we'll check if the value
  // is an instanceof Raw, and if it is, use the supplied value.
  Knex.Raw = function(sql, bindings) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return Knex.Instances['main'].Raw(sql, bindings);
  };

  var Raw = require('./lib/raw').Raw;
  _.extend(Raw.prototype, Common);

  // Knex.Initialize
  // -------

  // Takes a hash of options to initialize the database
  // connection. The `client` is required to choose which client
  // path above is loaded, or to specify a custom path to a client.
  // Other options, such as `connection` or `pool` are passed
  // into `client.initialize`.
  Knex.Initialize = function(name, options) {
    var Target, ClientCtor, client;

    // A name for the connection isn't required in
    // cases where there is only a single connection.
    if (_.isObject(name)) {
      options = name;
      name    = 'main';
    }

    // Don't try to initialize the same `name` twice... If necessary,
    // delete the instance from `Knex.Instances`.
    if (Knex.Instances[name]) {
      throw new Error('An instance named ' + name + ' already exists.');
    }

    client = options.client;

    if (!client) throw new Error('The client is required to use Knex.');

    // Checks if this is a default client. If it's not,
    // that means it's a custom lib, set the object to the client.
    if (_.isString(client)) {
      client = client.toLowerCase();
      try {
        ClientCtor = require(Clients[client]);
      } catch (e) {
        throw new Error(client + ' is not a valid Knex client, did you misspell it?');
      }
    } else {
      ClientCtor = client;
    }

    // Creates a new instance of the db client, passing the name and options.
    client = new ClientCtor(name, _.omit(options, 'client'));

    // If this is named "default" then we're setting this on the Knex
    Target = function(table) {
      var builder = new Knex.Builder(client);
      return table ? builder.from(table) : builder;
    };

    // Inherit static properties, without any that don't apply except
    // on the "root" `Knex`.
    _.extend(Target, _.omit(Knex, 'Initialize', 'Instances', 'VERSION'));

    // Initialize the schema builder methods.
    if (name === 'main') {
      initSchema(Knex, client);
      Knex.client = client;
    }

    initSchema(Target, client);

    // Specifically set the client on the current target.
    Target.client = client;
    Target.instanceName = name;

    // Setup the transacting function properly for this connection.
    Target.Transaction = function(handler) {
      return transaction.call(this, handler);
    };

    // Executes a Raw query.
    Target.Raw = function(sql, bindings) {
      var raw = new Raw(sql, bindings);
          raw.client = client;
      return raw;
    };

    // Add this instance to the global `Knex` instances, and return.
    Knex.Instances[name] = Target;

    return Target;
  };

  // Default client paths, located in the `./clients` directory.
  var Clients = {
    'mysql'    : './clients/server/mysql.js',
    'pg'       : './clients/server/postgres.js',
    'postgres' : './clients/server/postgres.js',
    'sqlite'   : './clients/server/sqlite3.js',
    'sqlite3'  : './clients/server/sqlite3.js'
  };

  // Named instances of Knex, presumably with different database
  // connections, the main instance being named "main"...
  Knex.Instances = {};

  // Export the Knex module
  module.exports = Knex;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);