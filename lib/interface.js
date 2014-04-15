module.exports = function(Target) {

var SqlString = require('./sqlstring');
var _ = require('lodash');

Target.prototype.toQuery = function() {
  var data = this.toSQL(this._method);
  if (this._errors.length > 0) throw this._errors[0];
  if (!_.isArray(data)) data = [data];
  return _.map(data, function(statement) {
    return SqlString.format(statement.sql, statement.bindings);
  }).join(';\n');
};

// Create a new instance of the `Runner`, passing in the current object.
Target.prototype.then = function(onFulfilled, onRejected) {
  var Runner = this.client.Runner;
  return new Runner(this).then(onFulfilled, onRejected);
};

// Add additional "options" to the builder. Typically used for client specific
// items, like the `mysql` and `sqlite3` drivers.
Target.prototype.options = function(opts) {
  this._options = this._options || [];
  this._options.push(opts);
  return this;
};

// Sets an explicit "connnection" we wish to use for this query.
Target.prototype.connection = function(connection) {
  this._connection = connection;
  return this;
};

// Set a debug flag for the current schema query stack.
Target.prototype.debug = function(val) {
  this._debug = (val == null ? true : val);
  return this;
};

// Set the transaction object for this query.
Target.prototype.transacting = function(t) {
  this._transacting = t;
  return this;
};

// Initializes a stream.
Target.prototype.stream = function(options) {
  var Runner = this.client.Runner;
  return new Runner(this).stream(options);
};

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
_.each(['catch', 'spread', 'otherwise', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
  Target.prototype[method] = function() {
    var then = this.then();
    return then[method].apply(then, arguments);
  };
});

};