(function(define) {

"use strict";

// Common
// -------
define(function(require, exports) {

  var _        = require('underscore');
  var when     = require('when');

  var Raw      = require('./raw').Raw;
  var Helpers  = require('./helpers').Helpers;

  // Methods common to both the `Grammar` and `SchemaGrammar` interfaces,
  // used to generate the sql in one form or another.
  exports.Common = {

    _debug: false,

    _promise: null,

    debug: function() {
      this._debug = true;
      return this;
    },

    // For those who dislike promise interfaces.
    // Multiple calls to `exec` will resolve with the same value
    // if called more than once. Any unhandled errors will be thrown
    // after the last block.
    exec: function(callback) {
      this._promise || (this._promise = this.runQuery());
      return this._promise.then(function(resp) {
        if (callback) callback(null, resp);
      }, function(err) {
        if (callback) callback(err, null);
      }).then(null, function(err) {
        setTimeout(function() { throw err; }, 0);
      });
    },

    // The promise interface for the query builder.
    then: function(onFulfilled, onRejected) {
      this._promise || (this._promise = this.runQuery());
      return this._promise.then(onFulfilled, onRejected);
    },

    // Returns an array of query strings filled out with the
    // correct values based on bindings, etc. Useful for debugging.
    toString: function() {
      this.type || (this.type = 'select');
      var data = this.toSql();
      var builder = this;
      if (!_.isArray(data)) data = [data];
      return _.map(data, function(str) {
        var questionCount = 0;
        return str.replace(/\?/g, function() {
          return builder.bindings[questionCount++];
        });
      }).join('; ');
    },

    // Explicitly sets the connection.
    connection: function(connection) {
      this._connection = connection;
      return this;
    },

    // The connection the current query is being run on, optionally
    // specified by the `connection` method.
    _connection: false,

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
    _cleanBindings: function() {
      var bindings = this.bindings;
      var cleaned = [];
      for (var i = 0, l = bindings.length; i < l; i++) {
        if (!(bindings[i] instanceof Raw)) {
          cleaned.push(bindings[i]);
        } else {
          push.apply(cleaned, bindings[i].bindings);
        }
      }
      return cleaned;
    },

    // Runs the query on the current builder instance and returns a promise.
    runQuery: function() {
      if (this.transaction) {
        if (!this.transaction.connection) {
          throw new Error('The transaction has already completed.');
        }
        this._connection = this.transaction.connection;
      }

      // Prep the SQL associated with the this.
      this.sql = this.toSql();
      this.bindings = this._cleanBindings();
      if (!_.isArray(this.sql)) this.sql = [this.sql];

      var chain;
      for (var i = 0, l = this.sql.length; i < l; i++) {
        if (chain) {
          chain.then(Helpers.multiQuery(this, i, chain));
        } else {
          chain = Helpers.multiQuery(this, i);
        }
      }
      return chain;
    },

    // Sets the current Builder connection to that of the
    // the currently running transaction
    transacting: function(t) {
      if (t) {
        if (this.transaction) throw new Error('A transaction has already been set for the current query chain');
        this.transaction = t;
      }
      return this;
    }

  };

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);