(function(define) {

"use strict";

define(function(require, exports) {

  var Helpers = require('../lib/helpers').Helpers;

  // Execute a query on the specified `Builder` or `SchemaBuilder`
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  var Query = function(client, builder, connection) {
    this.client  = client;
    this.builder = builder;
    this.debug   = builder.isDebugging || client.debug;
    this.disposeConnection = !connection;
    _.bindAll(this, 'prepareQuery', 'runQuery', 'handleError');
  };

  Query.prototype = {

    // Runs the query, returning the response from the query,
    // normalized by the `builder` library we're using.
    run: function() {
      var query  = this;
      var client = this.client;
      var chain  = this.getConnection()
        .tap(function(connection) {
          query.connection = connection;
        })
        .then(this.prepareQuery);

      if (this.debug) {
        chain.tap(function(data) {
          if (query.debug) client.debug(data);
        });
      }

      // Call the runQuery method on the current builder object,
      // and if it fails, handle the error.
      chain = chain.spread(this.runQuery).otherwise(this.handleError);

      // If there wasn't an explicit connection passed in along
      // with the `builder`, make sure that it gets released back
      // into the wild when the query completes.
      if (this.disposeConnection) {
        chain.ensure(function() {
          client.pool.release(query.connection);
        });
      }

      return chain;
    },

    // All query methods that should be defined in client implementations:

    prepareQuery: function() {},

    getConnection: function() {},

    // Given the sql, bindings, and connection, this runs a query and returns the result.
    runQuery: function(sql, bindings, connection) {
      return nodefn.call(_.bind(connection.query, connection), sql, bindings);
    },

    handleError: function() {}

  };

  Query.extend = Helpers.extend;

  exports.Query = Query;

});

})(
  typeof define === 'function' && define.amd ? define : function(factory) { factory(require, exports);
});