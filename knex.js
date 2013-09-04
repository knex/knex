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
  Knex.VERSION = '0.2.6';
  Knex.Builder = require('./lib/builder').Builder;
  Knex.JoinClause = require('./lib/joinclause').JoinClause;

  // Knex.Transaction
  // ---------
  Knex.Transaction = function(container) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return transaction.call(Knex.Instances['main'], container);
  };

  var transaction = function(container) {

    var client = this.client;

    return client.startTransaction().then(function(connection) {

      // Initiate a deferred object, so we know when the
      // transaction completes or fails, we know what to do.
      var dfd = when.defer();

      // The object passed around inside the transaction container.
      var containerObj = {
        commit: function(val) {
          client.finishTransaction('commit', this, dfd, val);
        },
        rollback: function(err) {
          client.finishTransaction('rollback', this, dfd, err);
        },
        // "rollback to"?
        connection: connection
      };

      // Ensure the transacting object methods are bound with the correct context.
      _.bindAll(containerObj, 'commit', 'rollback');

      // Call the container with the transaction
      // commit & rollback objects.
      container(containerObj);

      return dfd.promise;
    });
  };

  // Knex.Schema
  // ---------

  var initSchema = function(Target, client) {

    // Top level object for Schema related functions
    var Schema = Target.Schema = {};

    // Attach main static methods, which passthrough to the
    // SchemaBuilder instance methods
    _.each(['hasTable', 'createTable', 'table', 'dropTable', 'renameTable', 'dropTableIfExists'], function(method) {

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
  var SchemaInterface = {

    // Modify a table on the schema.
    table: function(callback) {
      this.callback(callback);
      return this._setType('table');
    },

    // Create a new table on the schema.
    createTable: function(callback) {
      this._addCommand('createTable');
      this.callback(callback);
      return this._setType('createTable');
    },

    // Drop a table from the schema.
    dropTable: function() {
      this._addCommand('dropTable');
      return this._setType('dropTable');
    },

    // Drop a table from the schema if it exists.
    dropTableIfExists: function() {
      this._addCommand('dropTableIfExists');
      return this._setType('dropTableIfExists');
    },

    // Rename a table on the schema.
    renameTable: function(to) {
      this._addCommand('renameTable', {to: to});
      return this._setType('renameTable');
    },

    // Determine if the given table exists.
    hasTable: function() {
      this.bindings.push(this.table);
      this._addCommand('tableExists');
      return this._setType('tableExists');
    }
  };

  // Knex.SchemaBuilder
  // --------
  Knex.SchemaBuilder = require('./lib/schemabuilder').SchemaBuilder;

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
      var builder = new Knex.Builder(table);
          builder.client = client;
          builder.grammar = client.grammar;
      return builder;
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
    'mysql'    : './clients/mysql.js',
    'pg'       : './clients/postgres.js',
    'postgres' : './clients/postgres.js',
    'sqlite'   : './clients/sqlite3.js',
    'sqlite3'  : './clients/sqlite3.js'
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