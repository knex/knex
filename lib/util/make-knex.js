'use strict';

var EventEmitter = require('events').EventEmitter;
var assign = require('lodash/object/assign');

var Migrator = require('../migrate');
var Seeder = require('../seed');
var FunctionHelper = require('../functionhelper');
var QueryInterface = require('../query/methods');
var helpers = require('../helpers');
var Promise = require('../promise');
var _ = require('lodash');

module.exports = function makeKnex(client) {

  // The object we're potentially using to kick off an initial chain.
  function knex(tableName) {
    var qb = knex.queryBuilder();
    if (!tableName) {
      helpers.warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.');
    }
    return tableName ? qb.table(tableName) : qb;
  }

  assign(knex, {

    Promise: require('../promise'),

    // A new query builder instance
    queryBuilder: function queryBuilder() {
      return client.queryBuilder();
    },

    raw: function raw() {
      return client.raw.apply(client, arguments);
    },

    batchInsert: function batchInsert(table, batch) {
      var chunkSize = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

      if (!_.isNumber(chunkSize) || chunkSize < 1) {
        throw new TypeError("Invalid chunkSize: " + chunkSize);
      }

      return this.transaction(function (tr) {

        //Avoid unnecessary call
        if (chunkSize !== 1) {
          batch = _.chunk(batch, chunkSize);
        }

        return Promise.all(batch.map(function (items) {
          return tr(table).insert(items);
        }));
      });
    },

    // Runs a new transaction, taking a container and returning a promise
    // for when the transaction is resolved.
    transaction: function transaction(container, config) {
      return client.transaction(container, config);
    },

    // Typically never needed, initializes the pool for a knex client.
    initialize: function initialize(config) {
      return client.initialize(config);
    },

    // Convenience method for tearing down the pool.
    destroy: function destroy(callback) {
      return client.destroy(callback);
    }

  });

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__ = '0.10.0';

  // Hook up the "knex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  QueryInterface.forEach(function (method) {
    knex[method] = function () {
      var builder = knex.queryBuilder();
      return builder[method].apply(builder, arguments);
    };
  });

  knex.client = client;

  Object.defineProperties(knex, {

    schema: {
      get: function get() {
        return client.schemaBuilder();
      }
    },

    migrate: {
      get: function get() {
        return new Migrator(knex);
      }
    },

    seed: {
      get: function get() {
        return new Seeder(knex);
      }
    },

    fn: {
      get: function get() {
        return new FunctionHelper(client);
      }
    }

  });

  // Passthrough all "start" and "query" events to the knex object.
  client.on('start', function (obj) {
    knex.emit('start', obj);
  });

  client.on('query', function (obj) {
    knex.emit('query', obj);
  });

  client.on('query-error', function (err, obj) {
    knex.emit('query-error', err, obj);
  });

  client.makeKnex = function (client) {
    return makeKnex(client);
  };

  return knex;
};