'use strict';

exports.__esModule = true;
exports['default'] = makeKnex;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _events = require('events');

var _migrate = require('../migrate');

var _migrate2 = _interopRequireDefault(_migrate);

var _seed = require('../seed');

var _seed2 = _interopRequireDefault(_seed);

var _functionhelper = require('../functionhelper');

var _functionhelper2 = _interopRequireDefault(_functionhelper);

var _queryMethods = require('../query/methods');

var _queryMethods2 = _interopRequireDefault(_queryMethods);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

var _batchInsert = require('./batchInsert');

var _batchInsert2 = _interopRequireDefault(_batchInsert);

function makeKnex(client) {

  // The object we're potentially using to kick off an initial chain.
  function knex(tableName) {
    var qb = knex.queryBuilder();
    if (!tableName) helpers.warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.');
    return tableName ? qb.table(tableName) : qb;
  }

  _lodash.assign(knex, {

    Promise: require('../promise'),

    // A new query builder instance.
    queryBuilder: function queryBuilder() {
      return client.queryBuilder();
    },

    raw: function raw() {
      return client.raw.apply(client, arguments);
    },

    batchInsert: function batchInsert(table, batch) {
      var chunkSize = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

      return new _batchInsert2['default'](this, table, batch, chunkSize);
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
  knex.VERSION = knex.__knex__ = require('../../package.json').version;

  // Hook up the "knex" object as an EventEmitter.
  var ee = new _events.EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  _queryMethods2['default'].forEach(function (method) {
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
        return new _migrate2['default'](knex);
      }
    },

    seed: {
      get: function get() {
        return new _seed2['default'](knex);
      }
    },

    fn: {
      get: function get() {
        return new _functionhelper2['default'](client);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL21ha2Uta25leC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7cUJBV3dCLFFBQVE7Ozs7OztzQkFWSCxRQUFROzt1QkFFaEIsWUFBWTs7OztvQkFDZCxTQUFTOzs7OzhCQUNELG1CQUFtQjs7Ozs0QkFDbkIsa0JBQWtCOzs7O3VCQUNwQixZQUFZOztJQUF6QixPQUFPOztzQkFDSSxRQUFROzsyQkFDUCxlQUFlOzs7O0FBRXhCLFNBQVMsUUFBUSxDQUFDLE1BQU0sRUFBRTs7O0FBR3ZDLFdBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUN2QixRQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7QUFDOUIsUUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUMxQixrRkFBa0YsQ0FDbkYsQ0FBQztBQUNGLFdBQU8sU0FBUyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFBO0dBQzVDOztBQUVELGlCQUFPLElBQUksRUFBRTs7QUFFWCxXQUFPLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQzs7O0FBRzlCLGdCQUFZLEVBQUEsd0JBQUc7QUFDYixhQUFPLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQTtLQUM3Qjs7QUFFRCxPQUFHLEVBQUEsZUFBRztBQUNKLGFBQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0tBQzNDOztBQUVELGVBQVcsRUFBQSxxQkFBQyxLQUFLLEVBQUUsS0FBSyxFQUFvQjtVQUFsQixTQUFTLHlEQUFHLElBQUk7O0FBQ3hDLGFBQU8sNkJBQWdCLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZEOzs7O0FBSUQsZUFBVyxFQUFBLHFCQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFDN0IsYUFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtLQUM3Qzs7O0FBR0QsY0FBVSxFQUFBLG9CQUFDLE1BQU0sRUFBRTtBQUNqQixhQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7S0FDakM7OztBQUdELFdBQU8sRUFBQSxpQkFBQyxRQUFRLEVBQUU7QUFDaEIsYUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0tBQ2hDOztHQUVGLENBQUMsQ0FBQTs7OztBQUlGLE1BQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLENBQUM7OztBQUdyRSxNQUFNLEVBQUUsR0FBRywwQkFBa0IsQ0FBQTtBQUM3QixPQUFLLElBQU0sR0FBRyxJQUFJLEVBQUUsRUFBRTtBQUNwQixRQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0dBQ3BCOzs7O0FBSUQsNEJBQWUsT0FBTyxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQ3RDLFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxZQUFXO0FBQ3hCLFVBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUNuQyxhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0tBQ2pELENBQUE7R0FDRixDQUFDLENBQUE7O0FBRUYsTUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7O0FBRXBCLFFBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7O0FBRTVCLFVBQU0sRUFBRTtBQUNOLFNBQUcsRUFBQSxlQUFHO0FBQ0osZUFBTyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUE7T0FDOUI7S0FDRjs7QUFFRCxXQUFPLEVBQUU7QUFDUCxTQUFHLEVBQUEsZUFBRztBQUNKLGVBQU8seUJBQWEsSUFBSSxDQUFDLENBQUE7T0FDMUI7S0FDRjs7QUFFRCxRQUFJLEVBQUU7QUFDSixTQUFHLEVBQUEsZUFBRztBQUNKLGVBQU8sc0JBQVcsSUFBSSxDQUFDLENBQUE7T0FDeEI7S0FDRjs7QUFFRCxNQUFFLEVBQUU7QUFDRixTQUFHLEVBQUEsZUFBRztBQUNKLGVBQU8sZ0NBQW1CLE1BQU0sQ0FBQyxDQUFBO09BQ2xDO0tBQ0Y7O0dBRUYsQ0FBQyxDQUFBOzs7QUFHRixRQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUMvQixRQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtHQUN4QixDQUFDLENBQUE7O0FBRUYsUUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBUyxHQUFHLEVBQUU7QUFDL0IsUUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7R0FDeEIsQ0FBQyxDQUFBOztBQUVGLFFBQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFVBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUMxQyxRQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7R0FDbkMsQ0FBQyxDQUFBOztBQUVGLFFBQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsVUFBUyxRQUFRLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRTtBQUMzRCxRQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7R0FDcEQsQ0FBQyxDQUFBOztBQUVGLFFBQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBOztBQUUxQixTQUFPLElBQUksQ0FBQTtDQUNaIiwiZmlsZSI6Im1ha2Uta25leC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcblxuaW1wb3J0IE1pZ3JhdG9yIGZyb20gJy4uL21pZ3JhdGUnO1xuaW1wb3J0IFNlZWRlciBmcm9tICcuLi9zZWVkJztcbmltcG9ydCBGdW5jdGlvbkhlbHBlciBmcm9tICcuLi9mdW5jdGlvbmhlbHBlcic7XG5pbXBvcnQgUXVlcnlJbnRlcmZhY2UgZnJvbSAnLi4vcXVlcnkvbWV0aG9kcyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4uL2hlbHBlcnMnO1xuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IEJhdGNoSW5zZXJ0IGZyb20gJy4vYmF0Y2hJbnNlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYWtlS25leChjbGllbnQpIHtcblxuICAvLyBUaGUgb2JqZWN0IHdlJ3JlIHBvdGVudGlhbGx5IHVzaW5nIHRvIGtpY2sgb2ZmIGFuIGluaXRpYWwgY2hhaW4uXG4gIGZ1bmN0aW9uIGtuZXgodGFibGVOYW1lKSB7XG4gICAgY29uc3QgcWIgPSBrbmV4LnF1ZXJ5QnVpbGRlcigpXG4gICAgaWYgKCF0YWJsZU5hbWUpIGhlbHBlcnMud2FybihcbiAgICAgICdjYWxsaW5nIGtuZXggd2l0aG91dCBhIHRhYmxlTmFtZSBpcyBkZXByZWNhdGVkLiBVc2Uga25leC5xdWVyeUJ1aWxkZXIoKSBpbnN0ZWFkLidcbiAgICApO1xuICAgIHJldHVybiB0YWJsZU5hbWUgPyBxYi50YWJsZSh0YWJsZU5hbWUpIDogcWJcbiAgfVxuXG4gIGFzc2lnbihrbmV4LCB7XG5cbiAgICBQcm9taXNlOiByZXF1aXJlKCcuLi9wcm9taXNlJyksXG5cbiAgICAvLyBBIG5ldyBxdWVyeSBidWlsZGVyIGluc3RhbmNlLlxuICAgIHF1ZXJ5QnVpbGRlcigpIHtcbiAgICAgIHJldHVybiBjbGllbnQucXVlcnlCdWlsZGVyKClcbiAgICB9LFxuXG4gICAgcmF3KCkge1xuICAgICAgcmV0dXJuIGNsaWVudC5yYXcuYXBwbHkoY2xpZW50LCBhcmd1bWVudHMpXG4gICAgfSxcblxuICAgIGJhdGNoSW5zZXJ0KHRhYmxlLCBiYXRjaCwgY2h1bmtTaXplID0gMTAwMCkge1xuICAgICAgcmV0dXJuIG5ldyBCYXRjaEluc2VydCh0aGlzLCB0YWJsZSwgYmF0Y2gsIGNodW5rU2l6ZSk7XG4gICAgfSxcblxuICAgIC8vIFJ1bnMgYSBuZXcgdHJhbnNhY3Rpb24sIHRha2luZyBhIGNvbnRhaW5lciBhbmQgcmV0dXJuaW5nIGEgcHJvbWlzZVxuICAgIC8vIGZvciB3aGVuIHRoZSB0cmFuc2FjdGlvbiBpcyByZXNvbHZlZC5cbiAgICB0cmFuc2FjdGlvbihjb250YWluZXIsIGNvbmZpZykge1xuICAgICAgcmV0dXJuIGNsaWVudC50cmFuc2FjdGlvbihjb250YWluZXIsIGNvbmZpZylcbiAgICB9LFxuXG4gICAgLy8gVHlwaWNhbGx5IG5ldmVyIG5lZWRlZCwgaW5pdGlhbGl6ZXMgdGhlIHBvb2wgZm9yIGEga25leCBjbGllbnQuXG4gICAgaW5pdGlhbGl6ZShjb25maWcpIHtcbiAgICAgIHJldHVybiBjbGllbnQuaW5pdGlhbGl6ZShjb25maWcpXG4gICAgfSxcblxuICAgIC8vIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgdGVhcmluZyBkb3duIHRoZSBwb29sLlxuICAgIGRlc3Ryb3koY2FsbGJhY2spIHtcbiAgICAgIHJldHVybiBjbGllbnQuZGVzdHJveShjYWxsYmFjaylcbiAgICB9XG5cbiAgfSlcblxuICAvLyBUaGUgYF9fa25leF9fYCBpcyB1c2VkIGlmIHlvdSBuZWVkIHRvIGR1Y2stdHlwZSBjaGVjayB3aGV0aGVyIHRoaXNcbiAgLy8gaXMgYSBrbmV4IGJ1aWxkZXIsIHdpdGhvdXQgYSBmdWxsIG9uIGBpbnN0YW5jZW9mYCBjaGVjay5cbiAga25leC5WRVJTSU9OID0ga25leC5fX2tuZXhfXyA9IHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb247XG5cbiAgLy8gSG9vayB1cCB0aGUgXCJrbmV4XCIgb2JqZWN0IGFzIGFuIEV2ZW50RW1pdHRlci5cbiAgY29uc3QgZWUgPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAgZm9yIChjb25zdCBrZXkgaW4gZWUpIHtcbiAgICBrbmV4W2tleV0gPSBlZVtrZXldXG4gIH1cblxuICAvLyBBbGxvdyBjaGFpbmluZyBtZXRob2RzIGZyb20gdGhlIHJvb3Qgb2JqZWN0LCBiZWZvcmVcbiAgLy8gYW55IG90aGVyIGluZm9ybWF0aW9uIGlzIHNwZWNpZmllZC5cbiAgUXVlcnlJbnRlcmZhY2UuZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgICBrbmV4W21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBrbmV4LnF1ZXJ5QnVpbGRlcigpXG4gICAgICByZXR1cm4gYnVpbGRlclttZXRob2RdLmFwcGx5KGJ1aWxkZXIsIGFyZ3VtZW50cylcbiAgICB9XG4gIH0pXG5cbiAga25leC5jbGllbnQgPSBjbGllbnRcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhrbmV4LCB7XG5cbiAgICBzY2hlbWE6IHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIGNsaWVudC5zY2hlbWFCdWlsZGVyKClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbWlncmF0ZToge1xuICAgICAgZ2V0KCkge1xuICAgICAgICByZXR1cm4gbmV3IE1pZ3JhdG9yKGtuZXgpXG4gICAgICB9XG4gICAgfSxcblxuICAgIHNlZWQ6IHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTZWVkZXIoa25leClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZm46IHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbkhlbHBlcihjbGllbnQpXG4gICAgICB9XG4gICAgfVxuXG4gIH0pXG5cbiAgLy8gUGFzc3Rocm91Z2ggYWxsIFwic3RhcnRcIiBhbmQgXCJxdWVyeVwiIGV2ZW50cyB0byB0aGUga25leCBvYmplY3QuXG4gIGNsaWVudC5vbignc3RhcnQnLCBmdW5jdGlvbihvYmopIHtcbiAgICBrbmV4LmVtaXQoJ3N0YXJ0Jywgb2JqKVxuICB9KVxuXG4gIGNsaWVudC5vbigncXVlcnknLCBmdW5jdGlvbihvYmopIHtcbiAgICBrbmV4LmVtaXQoJ3F1ZXJ5Jywgb2JqKVxuICB9KVxuXG4gIGNsaWVudC5vbigncXVlcnktZXJyb3InLCBmdW5jdGlvbihlcnIsIG9iaikge1xuICAgIGtuZXguZW1pdCgncXVlcnktZXJyb3InLCBlcnIsIG9iailcbiAgfSlcblxuICBjbGllbnQub24oJ3F1ZXJ5LXJlc3BvbnNlJywgZnVuY3Rpb24ocmVzcG9uc2UsIG9iaiwgYnVpbGRlcikge1xuICAgIGtuZXguZW1pdCgncXVlcnktcmVzcG9uc2UnLCByZXNwb25zZSwgb2JqLCBidWlsZGVyKVxuICB9KVxuXG4gIGNsaWVudC5tYWtlS25leCA9IG1ha2VLbmV4XG5cbiAgcmV0dXJuIGtuZXhcbn1cbiJdfQ==