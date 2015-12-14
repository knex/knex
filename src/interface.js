
var helpers = require('./helpers')

module.exports = function(Target) {
  var _         = require('lodash');

  Target.prototype.toQuery = function(tz) {
    var data = this.toSQL(this._method);
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
    return this.client.SqlString.format(sql, bindings, tz);
  };

  // Create a new instance of the `Runner`, passing in the current object.
  Target.prototype.then = function(/* onFulfilled, onRejected */) {
    var result = this.client.runner(this).run()
    return result.then.apply(result, arguments);
  };

  // Add additional "options" to the builder. Typically used for client specific
  // items, like the `mysql` and `sqlite3` drivers.
  Target.prototype.options = function(opts) {
    this._options = this._options || [];
    this._options.push(_.clone(opts) || {});
    this._cached  = undefined
    return this;
  };

  // Sets an explicit "connnection" we wish to use for this query.
  Target.prototype.connection = function(connection) {
    this._connection = connection;
    return this;
  };

  // Set a debug flag for the current schema query stack.
  Target.prototype.debug = function(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  };

  // Set the transaction object for this query.
  Target.prototype.transacting = function(t) {
    if (t && t.client) {
      if (!t.client.transacting) {
        helpers.warn('Invalid transaction value: ' + t.client)
      } else {
        this.client = t.client
      }
    }
    return this;
  };

  // Initializes a stream.
  Target.prototype.stream = function(options) {
    return this.client.runner(this).stream(options);
  };

  // Initialize a stream & pipe automatically.
  Target.prototype.pipe = function(writable, options) {
    return this.client.runner(this).pipe(writable, options);
  };

  // Creates a method which "coerces" to a promise, by calling a
  // "then" method on the current `Target`
  _.each(['bind', 'catch', 'finally', 'asCallback',
    'spread', 'map', 'reduce', 'tap', 'thenReturn',
    'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
    Target.prototype[method] = function() {
      var then = this.then();
      then = then[method].apply(then, arguments);
      return then;
    };
  });

};
