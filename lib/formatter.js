// Mixed into the query compiler & schema pieces. Assumes a `grammar`
// property exists on the current object.
var _            = require('lodash');
var QueryBuilder = require('./query/builder');

var Raw  = require('./raw');
var push = Array.prototype.push;

// Valid values for the `order by` clause generation.
var orderBys  = ['asc', 'desc'];

// A "formatter" instance is used to both determine how wrap, bind, and
// parameterize values within a query, keeping track of all bindings
// added to the query. This allows us to easily keep track of raw statements
// arbitrarily added to queries.
function Formatter() {
  this.bindings = [];
}

// Turns a list of values into a list of ?'s, joining them with commas unless
// a "joining" value is specified (e.g. ' and ')
Formatter.prototype.parameterize = function(values) {
  if (_.isFunction(values)) return this.parameter(values);
  values = _.isArray(values) ? values : [values];
  return _.map(values, this.parameter, this).join(', ');
};

// Checks whether a value is a function... if it is, we compile it
// otherwise we check whether it's a raw
Formatter.prototype.parameter = function(value) {
  if (_.isFunction(value)) {
    return this.outputQuery(this.compileCallback(value), true);
  }
  return this.checkRaw(value, true) || '?';
};

Formatter.prototype.checkRaw = function(value, parameter) {
  if (value instanceof QueryBuilder) {
    var query = value.toSQL();
    if (query.bindings) push.apply(this.bindings, query.bindings);
    return this.outputQuery(query);
  }
  if (value instanceof Raw) {
    if (value.bindings) push.apply(this.bindings, value.bindings);
    return value.sql;
  }
  if (parameter) this.bindings.push(value);
};

Formatter.prototype.rawOrFn = function(value, method) {
  if (_.isFunction(value)) {
    return this.outputQuery(this.compileCallback(value, method));
  }
  return this.checkRaw(value) || '';
};

// Puts the appropriate wrapper around a value depending on the database
// engine, unless it's a knex.raw value, in which case it's left alone.
Formatter.prototype.wrap = function(value) {
  var raw;
  if (_.isFunction(value)) {
    return this.outputQuery(this.compileCallback(value), true);
  }
  if (raw = this.checkRaw(value)) return raw;
  if (_.isNumber(value)) return value;
  return this._wrap(value + '');
};

// Coerce to string to prevent strange errors when it's not a string.
Formatter.prototype._wrapString = function(value) {
  var segments, asIndex = value.toLowerCase().indexOf(' as ');
  if (asIndex !== -1) {
    var first  = value.slice(0, asIndex);
    var second = value.slice(asIndex + 4);
    return this.wrap(first) + ' as ' + this.wrap(second);
  }
  var wrapped = [];
  segments = value.split('.');
  for (var i = 0, l = segments.length; i < l; i = ++i) {
    value = segments[i];
    if (i === 0 && segments.length > 1) {
      wrapped.push(this.wrap(value));
    } else {
      wrapped.push(this.wrapValue(value));
    }
  }
  return wrapped.join('.');
};

// Accepts a string or array of columns to wrap as appropriate.
Formatter.prototype.columnize = function(target) {
  var columns = (_.isString(target) ? [target] : target);
  return _.map(columns, this.wrap, this).join(', ');
};

// The operator method takes a value and returns something or other.
Formatter.prototype.operator = function(value) {
  var raw;
  if (raw = this.checkRaw(value)) return raw;
  if (!_.contains(this.operators, (value || '').toLowerCase())) {
    throw new TypeError('The operator "' + value + '" is not permitted');
  }
  return value;
};

// Specify the direction of the ordering.
Formatter.prototype.direction = function(value) {
  var raw;
  if (raw = this.checkRaw(value)) return raw;
  return _.contains(orderBys, (value || '').toLowerCase()) ? value : 'asc';
};

// Compiles a callback using the query builder.
Formatter.prototype.compileCallback = function(callback, method) {
  var client = this.client;

  // Build the callback
  var builder  = new client.QueryBuilder();
  callback.call(builder, builder);

  // Compile the callback, using the current formatter (to track all bindings).
  var compiler = new client.QueryCompiler(builder);
  compiler.formatter = this;

  // Return the compiled & parameterized sql.
  return compiler.toSQL(method || 'select');
};

// Ensures the query is aliased if necessary.
Formatter.prototype.outputQuery = function(compiled, alwaysWrapped) {
  var sql = compiled.sql || '';
  if (sql) {
    if (compiled.method === 'select' && alwaysWrapped || compiled.as) {
      sql = '(' + sql + ')';
      if (compiled.as) sql += ' as ' + this.wrap(compiled.as);
    }
  }
  return sql;
};

module.exports = Formatter;