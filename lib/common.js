// Common
// -------
(function(define) {

"use strict";

// Some functions which are common to both the
// `Builder` and `SchemaBuilder` classes.
define(function(require, exports) {

  var _        = require('underscore');
  var Helpers  = require('./helpers').Helpers;

  // Methods common to both the `Grammar` and `SchemaGrammar` interfaces,
  // used to generate the sql in one form or another.
  exports.Common = {

    // Creates a new instance of the current `Builder` or `SchemaBuilder`,
    // with the correct current `knex` instance.
    instance: function() {
      var builder = new this.constructor(this.knex);
          builder.table = this.table;
      return builder;
    },

    // Sets the flag, so that when this object is passed into the
    // client adapter, we know to `log` the query.
    debug: function() {
      this.flags.debug = true;
      return this;
    },

    // Sets `options` which are passed along to the database client.
    options: function(opts) {
      this.flags.options = _.extend({}, this.flags.options, opts);
      return this;
    },

    // For those who dislike promise interfaces.
    // Multiple calls to `exec` will resolve with the same value
    // if called more than once. Any unhandled errors will be thrown
    // after the last block.
    exec: function(callback) {
      this._promise || (this._promise = this.client.query(this));
      return this._promise.then(function(resp) {
        if (callback) callback(null, resp);
      }, function(err) {
        if (callback) callback(err, null);
      }).otherwise(function(err) {
        setTimeout(function() { throw err; }, 0);
      });
    },

    // The promise interface for the query builder.
    then: function(onFulfilled, onRejected) {
      this._promise || (this._promise = this.client.query(this));
      return this._promise.then(onFulfilled, onRejected);
    },

    // Passthrough to the convenient `tap` mechanism of when.js
    tap: function(handler) {
      this._promise = this._promise || this.client.query(this);
      return this._promise.tap(handler);
    },

    // Returns an array of query strings filled out with the
    // correct values based on bindings, etc. Useful for debugging.
    toString: function() {
      var builder = this, data = this.clone().toSql();
      if (!_.isArray(data)) data = [data];
      return _.map(data, function(str) {
        var questionCount = 0;
        return str.replace(/\?/g, function() {
          return builder.bindings[questionCount++];
        });
      }).join('; ');
    },

    // Converts the current statement to a sql string
    toSql: function() {
      return this.grammar.toSql(this);
    },

    // Explicitly sets the connection.
    connection: function(connection) {
      this.usingConnection = connection;
      return this;
    },

    // The connection the current query is being run on, optionally
    // specified by the `connection` method.
    usingConnection: false,

    // Default handler for a response is to pass it along.
    handleResponse: function(resp) {
      if (this && this.grammar && this.grammar.handleResponse) {
        return this.grammar.handleResponse(this, resp);
      }
      return resp;
    },

    // Sets the "type" of the current query, so we can potentially place
    // `select`, `update`, `del`, etc. anywhere in the query statement
    // and have it come out fine.
    _setType: function(type) {
      if (this.type) {
        throw new Error('The query type has already been set to ' + this.type);
      }
      this.type = type;
      return this;
    },

    // Returns all bindings excluding the `Knex.Raw` types.
    cleanBindings: function() {
      var bindings = this.bindings;
      var cleaned = [];
      for (var i = 0, l = bindings.length; i < l; i++) {
        // if (bindings[i] == void 0) continue;
        if (!bindings[i] || bindings[i]._source !== 'Raw') {
          cleaned.push(bindings[i]);
        } else {
          push.apply(cleaned, bindings[i].bindings);
        }
      }
      return cleaned;
    },

    // Sets the current Builder connection to that of the
    // the currently running transaction
    transacting: function(t) {
      if (t) {
        if (this.transaction) throw new Error('A transaction has already been set for the current query chain');
        this.transaction = t;
        this.usingConnection = t.connection;
      }
      return this;
    }

  };

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);