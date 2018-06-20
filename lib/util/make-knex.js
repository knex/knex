'use strict';

exports.__esModule = true;

var _defineProperties = require('babel-runtime/core-js/object/define-properties');

var _defineProperties2 = _interopRequireDefault(_defineProperties);

exports.default = makeKnex;

var _events = require('events');

var _migrate = require('../migrate');

var _migrate2 = _interopRequireDefault(_migrate);

var _seed = require('../seed');

var _seed2 = _interopRequireDefault(_seed);

var _functionhelper = require('../functionhelper');

var _functionhelper2 = _interopRequireDefault(_functionhelper);

var _methods = require('../query/methods');

var _methods2 = _interopRequireDefault(_methods);

var _lodash = require('lodash');

var _batchInsert2 = require('./batchInsert');

var _batchInsert3 = _interopRequireDefault(_batchInsert2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeKnex(client) {

  // The object we're potentially using to kick off an initial chain.
  function knex(tableName, options) {
    var qb = knex.queryBuilder();
    if (!tableName) client.logger.warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.');
    return tableName ? qb.table(tableName, options) : qb;
  }

  (0, _lodash.assign)(knex, {

    Promise: require('bluebird'),

    // A new query builder instance.
    queryBuilder: function queryBuilder() {
      return client.queryBuilder();
    },
    raw: function raw() {
      return client.raw.apply(client, arguments);
    },
    batchInsert: function batchInsert(table, batch) {
      var chunkSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;

      return (0, _batchInsert3.default)(this, table, batch, chunkSize);
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
    },
    ref: function ref(_ref) {
      return client.ref(_ref);
    }
  });

  // Hook up the "knex" object as an EventEmitter.
  var ee = new _events.EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  _methods2.default.forEach(function (method) {
    knex[method] = function () {
      var builder = knex.queryBuilder();
      return builder[method].apply(builder, arguments);
    };
  });

  knex.client = client;

  var VERSION = '0.12.6';

  (0, _defineProperties2.default)(knex, {

    __knex__: {
      get: function get() {
        knex.client.logger.warn('knex.__knex__ is deprecated, you can get the module version' + "by running require('knex/package').version");
        return VERSION;
      }
    },

    VERSION: {
      get: function get() {
        knex.client.logger.warn('knex.VERSION is deprecated, you can get the module version' + "by running require('knex/package').version");
        return VERSION;
      }
    },

    schema: {
      get: function get() {
        return client.schemaBuilder();
      }
    },

    migrate: {
      get: function get() {
        return new _migrate2.default(knex);
      }
    },

    seed: {
      get: function get() {
        return new _seed2.default(knex);
      }
    },

    fn: {
      get: function get() {
        return new _functionhelper2.default(client);
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
  client.on('query-response', function (response, obj, builder) {
    knex.emit('query-response', response, obj, builder);
  });

  client.makeKnex = makeKnex;

  return knex;
}
module.exports = exports['default'];