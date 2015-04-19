'use strict';

var assert = require('assert');

module.exports = function(Target) {

var _         = require('lodash')
var SqlString = require('./dialects/mysql/string')

Target.prototype.toQuery = function(tz) {
  var data = this.toSQL(this._method)
  if (!_.isArray(data)) data = [data];
  return _.map(data, function(statement) {
    return this._formatQuery(statement.sql, statement.bindings, tz);
  }, this).join(';\n');
};

// Create a new instance of the `Runner`, passing in the current object.
Target.prototype.then = function(/* onFulfilled, onRejected */) {
  var stream = this.streamInto([])
  return stream.apply(stream, arguments)
};

Target.prototype.streamInto = function(transformer, config) {
  var transformer = transduce.transformer(transformer)
  return this.streamIntoRaw(transformer, config)
};

Target.prototype.streamIntoRaw = function(transformer, config) {
  
};

// Add additional "options" to the builder. Typically used for client specific
// items, like the `mysql` and `sqlite3` drivers.
Target.prototype.options = function(opts) {
  this._options = this._options || [];
  this._options.push(_.clone(opts) || {});
  return this;
};

// Sets an explicit "connnection" we wish to use for this query.
Target.prototype.connection = function(connection) {
  this._connection = connection;
  return this;
};

// Set a debug flag for the current schema query stack.
Target.prototype.debug = function(enabled) {
  assert(!arguments.length || typeof enabled === 'boolean', 'debug requires a boolean');
  this._debug = arguments.length ? enabled : true;
  return this;
};

// Set the transaction object for this query.
Target.prototype.transacting = function(t) {
  return this;
};

// Initializes a stream.
Target.prototype.stream = function(options) {
  var Runner = this.client.Runner;
  return new Runner(this).stream(options);
};

// Initialize a stream & pipe automatically.
Target.prototype.pipe = function(writable) {
  var Runner = this.client.Runner;
  return new Runner(this).pipe(writable);
};

// Format the query as sql, prepping bindings as necessary.
Target.prototype._formatQuery = function(sql, bindings, tz) {
  if (this.client && this.client.prepBindings) {
    bindings = this.client.prepBindings(bindings, tz);
  }
  return SqlString.format(sql, bindings, true, tz);
};

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
_.each([
  'bind', 'catch', 'spread', 'otherwise', 
  'map', 'reduce', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'
], function(method) {
  Target.prototype[method] = function() {
    var then = this.then();
    return then[method].apply(then, arguments);
  };
});

};
