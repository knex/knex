'use strict';

var Promise      = require('bluebird');

module.exports = function(Target) {
var _ = require('lodash');
var SqlString = require('./dialects/mysql/string');

var hookTypes = ['after'];
Target.prototype.hook = function(type, cb) {
  if (!_.isFunction(cb) || !_.contains(hookTypes, type)) {
    throw new Error('Invalid arguments');
  }
  if (!this._hooks) { this._hooks = { }; }
  
  var arr = this._hooks[type] || [];
  arr.push(cb);
  this._hooks[type] = arr;
  return this;
};
Target.prototype.runHook = Promise.method(function(type, data) {
  // no hooks - return original data
  if (!this._hooks || !this._hooks[type]) { return data; }
  
  // run hooks in sequence
  return Promise.reduce(this._hooks[type], function (retVal, cur) {
    // not a function? ignore
    if (!_.isFunction(cur)) { return retVal; }
    
    return Promise.try(function () {
      return cur(retVal);
    }).then(function (val) {
      // function didn't return anything, don't change anything
      if (val !== void 0) { return val; }
      return retVal;
    });
  }, data);
});

Target.prototype.toQuery = function(tz) {
  var data = this.toSQL(this._method);
  if (this._errors && this._errors.length > 0) throw this._errors[0];
  if (!_.isArray(data)) data = [data];
  return _.map(data, function(statement) {
    return this._formatQuery(statement.sql, statement.bindings, tz);
  }, this).join(';\n');
};

// Format the query as sql, prepping bindings as necessary.
Target.prototype._formatQuery = function(sql, bindings, tz) {
  if (this.client && this.client.prepBindings) {
    bindings = this.client.prepBindings(bindings, tz);
  }
  return SqlString.format(sql, bindings, true, tz);
};

// Create a new instance of the `Runner`, passing in the current object.
Target.prototype.then = function(/* onFulfilled, onRejected */) {
  var Runner = this.client.Runner;
  var result = new Runner(this).run();
  return result.then.apply(result, arguments);
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
Target.prototype.debug = function(val) {
  this._debug = (val === undefined || val === null) ? true : val;
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

// Initialize a stream & pipe automatically.
Target.prototype.pipe = function(writable) {
  var Runner = this.client.Runner;
  return new Runner(this).pipe(writable);
};

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
_.each(['bind', 'catch', 'spread', 'otherwise', 'map', 'reduce', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
  Target.prototype[method] = function() {
    var then = this.then();
    return then[method].apply(then, arguments);
  };
});

};
