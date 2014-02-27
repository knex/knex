// Common
// -------

// Some functions which are common to both the
// `Builder` and `SchemaBuilder` classes.
var _         = require('lodash');
var Helpers   = require('./helpers').Helpers;
var SqlString = require('./sqlstring').SqlString;

var Promise   = require('./promise').Promise;

var push      = [].push;

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
    return this.then().nodeify(callback);
  },

  // The promise interface for the query builder.
  then: function(onFulfilled, onRejected) {
    if (!this._promise) {
      this._promise = Promise.bind(this);
      this._promise = this._promise.then(function() {
        return this.client.query(this);
      }).bind();
    }
    return this._promise.then(onFulfilled, onRejected);
  },

  map: function() {
    var promise = this.then();
    return promise.map.apply(promise, arguments);
  },

  reduce: function() {
    var promise = this.then();
    return promise.reduce.apply(promise, arguments);
  },

  catch: function() {
    return this.caught.apply(this, arguments);
  },

  caught: function() {
    var promise = this.then();
    return promise.caught.apply(promise, arguments);
  },

  lastly: function() {
    var promise = this.then();
    return promise.lastly.apply(promise, arguments);
  },

  finally: function() {
    return this.lastly.apply(this, arguments);
  },

  tap: function(handler) {
    return this.then().tap(handler);
  },

  // Returns an array of query strings filled out with the
  // correct values based on bindings, etc. Useful for debugging.
  toString: function() {
    // TODO: get rid of the need to clone the object here...
    var builder = this, data = this.clone().toSql();
    if (!_.isArray(data)) data = [data];
    return _.map(data, function(str) {
      return SqlString.format(str, builder.getBindings());
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
  getBindings: function() {
    return this.grammar.getBindings(this);
  },

  // Sets the current Builder connection to that of the
  // the currently running transaction
  transacting: function(t) {
    if (t) {
      if (this.transaction) throw new Error('A transaction has already been set for the current query chain');
      var flags = this.flags;
      this.transaction = t;
      this.usingConnection = t.connection;

      // Add "forUpdate" and "forShare" here, since these are only relevant
      // within the context of a transaction.
      this.forUpdate = function() {
        flags.selectMode = 'ForUpdate';
        return this;
      };
      this.forShare = function() {
        flags.selectMode = 'ForShare';
        return this;
      };
    }
    return this;
  }

};
