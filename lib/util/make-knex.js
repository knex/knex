'use strict';

var EventEmitter = require('events').EventEmitter;
var assign = require('lodash/object/assign');

var Migrator = require('../migrate');
var Seeder = require('../seed');
var FunctionHelper = require('../functionhelper');
var QueryInterface = require('../query/methods');
var helpers = require('../helpers');

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
  knex.VERSION = knex.__knex__ = '0.9.0';

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

  client.makeKnex = function (client) {
    return makeKnex(client);
  };

  return knex;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL21ha2Uta25leC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLElBQUksWUFBWSxHQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUE7QUFDbkQsSUFBSSxNQUFNLEdBQVcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7O0FBRXJELElBQUksUUFBUSxHQUFTLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUMxQyxJQUFJLE1BQU0sR0FBVyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDdkMsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUE7QUFDakQsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUE7QUFDaEQsSUFBSSxPQUFPLEdBQVUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBOztBQUUxQyxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsUUFBUSxDQUFDLE1BQU0sRUFBRTs7O0FBR3pDLFdBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUN2QixRQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7QUFDNUIsUUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNkLGFBQU8sQ0FBQyxJQUFJLENBQUMsa0ZBQWtGLENBQUMsQ0FBQTtLQUNqRztBQUNELFdBQU8sU0FBUyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFBO0dBQzVDOztBQUVELFFBQU0sQ0FBQyxJQUFJLEVBQUU7O0FBRVgsV0FBTyxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUM7OztBQUc5QixnQkFBWSxFQUFFLHdCQUFXO0FBQ3ZCLGFBQU8sTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFBO0tBQzdCOztBQUVELE9BQUcsRUFBRSxlQUFXO0FBQ2QsYUFBTyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUE7S0FDM0M7Ozs7QUFJRCxlQUFXLEVBQUUscUJBQVMsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUN2QyxhQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0tBQzdDOzs7QUFHRCxjQUFVLEVBQUUsb0JBQVMsTUFBTSxFQUFFO0FBQzNCLGFBQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtLQUNqQzs7O0FBR0QsV0FBTyxFQUFFLGlCQUFTLFFBQVEsRUFBRTtBQUMxQixhQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7S0FDaEM7O0dBRUYsQ0FBQyxDQUFBOzs7O0FBSUYsTUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFJLE9BQU8sQ0FBQTs7O0FBR3ZDLE1BQUksRUFBRSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUE7QUFDM0IsT0FBSyxJQUFJLEdBQUcsSUFBSSxFQUFFLEVBQUU7QUFDbEIsUUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtHQUNwQjs7OztBQUlELGdCQUFjLENBQUMsT0FBTyxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQ3RDLFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxZQUFXO0FBQ3hCLFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUNqQyxhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0tBQ2pELENBQUE7R0FDRixDQUFDLENBQUE7O0FBRUYsTUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7O0FBRXBCLFFBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7O0FBRTVCLFVBQU0sRUFBRTtBQUNOLFNBQUcsRUFBRSxlQUFXO0FBQ2QsZUFBTyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUE7T0FDOUI7S0FDRjs7QUFFRCxXQUFPLEVBQUU7QUFDUCxTQUFHLEVBQUUsZUFBVztBQUNkLGVBQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7T0FDMUI7S0FDRjs7QUFFRCxRQUFJLEVBQUU7QUFDSixTQUFHLEVBQUUsZUFBVztBQUNkLGVBQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7T0FDeEI7S0FDRjs7QUFFRCxNQUFFLEVBQUU7QUFDRixTQUFHLEVBQUUsZUFBVztBQUNkLGVBQU8sSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUE7T0FDbEM7S0FDRjs7R0FFRixDQUFDLENBQUE7OztBQUdGLFFBQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVMsR0FBRyxFQUFFO0FBQy9CLFFBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0dBQ3hCLENBQUMsQ0FBQTs7QUFFRixRQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUMvQixRQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtHQUN4QixDQUFDLENBQUE7O0FBRUYsUUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFTLE1BQU0sRUFBRTtBQUNqQyxXQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUN4QixDQUFBOztBQUVELFNBQU8sSUFBSSxDQUFBO0NBQ1osQ0FBQSIsImZpbGUiOiJtYWtlLWtuZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBFdmVudEVtaXR0ZXIgICA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxudmFyIGFzc2lnbiAgICAgICAgID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9hc3NpZ24nKTtcblxudmFyIE1pZ3JhdG9yICAgICAgID0gcmVxdWlyZSgnLi4vbWlncmF0ZScpXG52YXIgU2VlZGVyICAgICAgICAgPSByZXF1aXJlKCcuLi9zZWVkJylcbnZhciBGdW5jdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4uL2Z1bmN0aW9uaGVscGVyJylcbnZhciBRdWVyeUludGVyZmFjZSA9IHJlcXVpcmUoJy4uL3F1ZXJ5L21ldGhvZHMnKVxudmFyIGhlbHBlcnMgICAgICAgID0gcmVxdWlyZSgnLi4vaGVscGVycycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZUtuZXgoY2xpZW50KSB7XG5cbiAgLy8gVGhlIG9iamVjdCB3ZSdyZSBwb3RlbnRpYWxseSB1c2luZyB0byBraWNrIG9mZiBhbiBpbml0aWFsIGNoYWluLlxuICBmdW5jdGlvbiBrbmV4KHRhYmxlTmFtZSkge1xuICAgIHZhciBxYiA9IGtuZXgucXVlcnlCdWlsZGVyKClcbiAgICBpZiAoIXRhYmxlTmFtZSkge1xuICAgICAgaGVscGVycy53YXJuKCdjYWxsaW5nIGtuZXggd2l0aG91dCBhIHRhYmxlTmFtZSBpcyBkZXByZWNhdGVkLiBVc2Uga25leC5xdWVyeUJ1aWxkZXIoKSBpbnN0ZWFkLicpXG4gICAgfVxuICAgIHJldHVybiB0YWJsZU5hbWUgPyBxYi50YWJsZSh0YWJsZU5hbWUpIDogcWJcbiAgfVxuXG4gIGFzc2lnbihrbmV4LCB7XG5cbiAgICBQcm9taXNlOiByZXF1aXJlKCcuLi9wcm9taXNlJyksXG5cbiAgICAvLyBBIG5ldyBxdWVyeSBidWlsZGVyIGluc3RhbmNlXG4gICAgcXVlcnlCdWlsZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBjbGllbnQucXVlcnlCdWlsZGVyKClcbiAgICB9LFxuXG4gICAgcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBjbGllbnQucmF3LmFwcGx5KGNsaWVudCwgYXJndW1lbnRzKVxuICAgIH0sXG5cbiAgICAvLyBSdW5zIGEgbmV3IHRyYW5zYWN0aW9uLCB0YWtpbmcgYSBjb250YWluZXIgYW5kIHJldHVybmluZyBhIHByb21pc2VcbiAgICAvLyBmb3Igd2hlbiB0aGUgdHJhbnNhY3Rpb24gaXMgcmVzb2x2ZWQuXG4gICAgdHJhbnNhY3Rpb246IGZ1bmN0aW9uKGNvbnRhaW5lciwgY29uZmlnKSB7XG4gICAgICByZXR1cm4gY2xpZW50LnRyYW5zYWN0aW9uKGNvbnRhaW5lciwgY29uZmlnKVxuICAgIH0sXG5cbiAgICAvLyBUeXBpY2FsbHkgbmV2ZXIgbmVlZGVkLCBpbml0aWFsaXplcyB0aGUgcG9vbCBmb3IgYSBrbmV4IGNsaWVudC5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHJldHVybiBjbGllbnQuaW5pdGlhbGl6ZShjb25maWcpXG4gICAgfSxcblxuICAgIC8vIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgdGVhcmluZyBkb3duIHRoZSBwb29sLlxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gY2xpZW50LmRlc3Ryb3koY2FsbGJhY2spXG4gICAgfVxuXG4gIH0pXG5cbiAgLy8gVGhlIGBfX2tuZXhfX2AgaXMgdXNlZCBpZiB5b3UgbmVlZCB0byBkdWNrLXR5cGUgY2hlY2sgd2hldGhlciB0aGlzXG4gIC8vIGlzIGEga25leCBidWlsZGVyLCB3aXRob3V0IGEgZnVsbCBvbiBgaW5zdGFuY2VvZmAgY2hlY2suXG4gIGtuZXguVkVSU0lPTiA9IGtuZXguX19rbmV4X18gID0gJzAuOS4wJ1xuXG4gIC8vIEhvb2sgdXAgdGhlIFwia25leFwiIG9iamVjdCBhcyBhbiBFdmVudEVtaXR0ZXIuXG4gIHZhciBlZSA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBmb3IgKHZhciBrZXkgaW4gZWUpIHtcbiAgICBrbmV4W2tleV0gPSBlZVtrZXldXG4gIH1cblxuICAvLyBBbGxvdyBjaGFpbmluZyBtZXRob2RzIGZyb20gdGhlIHJvb3Qgb2JqZWN0LCBiZWZvcmVcbiAgLy8gYW55IG90aGVyIGluZm9ybWF0aW9uIGlzIHNwZWNpZmllZC5cbiAgUXVlcnlJbnRlcmZhY2UuZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgICBrbmV4W21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBidWlsZGVyID0ga25leC5xdWVyeUJ1aWxkZXIoKVxuICAgICAgcmV0dXJuIGJ1aWxkZXJbbWV0aG9kXS5hcHBseShidWlsZGVyLCBhcmd1bWVudHMpXG4gICAgfVxuICB9KVxuXG4gIGtuZXguY2xpZW50ID0gY2xpZW50XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoa25leCwge1xuXG4gICAgc2NoZW1hOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY2xpZW50LnNjaGVtYUJ1aWxkZXIoKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBtaWdyYXRlOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1pZ3JhdG9yKGtuZXgpXG4gICAgICB9XG4gICAgfSxcblxuICAgIHNlZWQ6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2VlZGVyKGtuZXgpXG4gICAgICB9XG4gICAgfSxcblxuICAgIGZuOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uSGVscGVyKGNsaWVudClcbiAgICAgIH1cbiAgICB9XG5cbiAgfSlcblxuICAvLyBQYXNzdGhyb3VnaCBhbGwgXCJzdGFydFwiIGFuZCBcInF1ZXJ5XCIgZXZlbnRzIHRvIHRoZSBrbmV4IG9iamVjdC5cbiAgY2xpZW50Lm9uKCdzdGFydCcsIGZ1bmN0aW9uKG9iaikge1xuICAgIGtuZXguZW1pdCgnc3RhcnQnLCBvYmopXG4gIH0pXG5cbiAgY2xpZW50Lm9uKCdxdWVyeScsIGZ1bmN0aW9uKG9iaikge1xuICAgIGtuZXguZW1pdCgncXVlcnknLCBvYmopXG4gIH0pXG5cbiAgY2xpZW50Lm1ha2VLbmV4ID0gZnVuY3Rpb24oY2xpZW50KSB7XG4gICAgcmV0dXJuIG1ha2VLbmV4KGNsaWVudClcbiAgfVxuXG4gIHJldHVybiBrbmV4XG59XG4iXX0=