(function(define) {

"use strict";

define(function(require, exports) {

  var Helpers = require('../lib/helpers').Helpers;

  // The `ClientBase` is assumed as the object that all database `clients`
  // inherit from, and is used in an `instanceof` check when initializing the
  // library. If you wish to write or customize an adapter, just inherit from
  // this base, with ClientBase.extend, and you're good to go.
  var ClientBase = function() {};

  // The methods assumed when building a client.
  ClientBase.prototype = {

    // The biggest method of the client, the `query` is used to
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
    finishTransaction: function(type, trans, dfd, msg) {},

    // The pool defaults.
    poolDefaults: function() {}

  };

  ClientBase.extend = Helpers.extend;

  exports.ClientBase = ClientBase;

});

})(
  typeof define === 'function' && define.amd ? define : function(factory) { factory(require, exports);
});