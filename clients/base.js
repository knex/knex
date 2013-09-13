// ClientBase
// ----------
(function(define) {

"use strict";

define(function(require, exports) {

  var Helpers = require('../lib/helpers').Helpers;

  // The `ClientBase` is assumed as the object that all database `clients`
  // inherit from, and is used in an `instanceof` check when initializing the
  // library. If you wish to write or customize an adapter, just inherit from
  // this base, with `ClientBase.extend`, and you're good to go.
  var ClientBase = function() {};

  // The methods assumed when building a client.
  ClientBase.prototype = {

    // Gets the raw connection for the current client.
    getRawConnection: function() {},

    // Execute a query on the specified `Builder` or `SchemaBuilder`
    // interface. If a `connection` is specified, use it, otherwise
    // acquire a connection, and then dispose of it when we're done.
    query: function() {},

    // Retrieves a connection from the connection pool,
    // returning a promise.
    getConnection: function() {},

    // Releases a connection from the connection pool,
    // returning a promise.
    releaseConnection: function(conn) {},

    // Begins a transaction statement on the instance,
    // resolving with the connection of the current transaction.
    startTransaction: function() {},

    // Finishes a transaction, taking the `type`
    finishTransaction: function(type, transaction, msg) {},

    // The pool defaults.
    poolDefaults: function() {}

  };

  // Grab the standard `Object.extend` as popularized by Backbone.js.
  ClientBase.extend = Helpers.extend;

  exports.ClientBase = ClientBase;

});

})(
  typeof define === 'function' && define.amd ? define : function(factory) { factory(require, exports);
});