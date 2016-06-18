'use strict';

var QueryBuilder = require('./query/builder');
var Raw = require('./raw');
var assign = require('lodash/object/assign');
var transform = require('lodash/object/transform');

function Formatter(client) {
  this.client = client;
  this.bindings = [];
}

assign(Formatter.prototype, {

  // Accepts a string or array of columns to wrap as appropriate.
  columnize: function columnize(target) {
    var columns = typeof target === 'string' ? [target] : target;
    var str = '',
        i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += this.wrap(columns[i]);
    }
    return str;
  },

  // Turns a list of values into a list of ?'s, joining them with commas unless
  // a "joining" value is specified (e.g. ' and ')
  parameterize: function parameterize(values, notSetValue) {
    if (typeof values === 'function') return this.parameter(values);
    values = Array.isArray(values) ? values : [values];
    var str = '',
        i = -1;
    while (++i < values.length) {
      if (i > 0) str += ', ';
      str += this.parameter(values[i] === undefined ? notSetValue : values[i]);
    }
    return str;
  },

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter: function parameter(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    }
    return this.unwrapRaw(value, true) || '?';
  },

  unwrapRaw: function unwrapRaw(value, isParameter) {
    var query;
    if (value instanceof QueryBuilder) {
      query = this.client.queryCompiler(value).toSQL();
      if (query.bindings) {
        this.bindings = this.bindings.concat(query.bindings);
      }
      return this.outputQuery(query, isParameter);
    }
    if (value instanceof Raw) {
      value.client = this.client;
      query = value.toSQL();
      if (query.bindings) {
        this.bindings = this.bindings.concat(query.bindings);
      }
      return query.sql;
    }
    if (isParameter) {
      this.bindings.push(value);
    }
  },

  rawOrFn: function rawOrFn(value, method) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value, method));
    }
    return this.unwrapRaw(value) || '';
  },

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.
  wrap: function wrap(value) {
    var raw;
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    }
    raw = this.unwrapRaw(value);
    if (raw) return raw;
    if (typeof value === 'number') return value;
    return this._wrapString(value + '');
  },

  wrapAsIdentifier: function wrapAsIdentifier(value) {
    return this.client.wrapIdentifier((value || '').trim());
  },

  alias: function alias(first, second) {
    return first + ' as ' + second;
  },

  // The operator method takes a value and returns something or other.
  operator: function operator(value) {
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    if (operators[(value || '').toLowerCase()] !== true) {
      throw new TypeError('The operator "' + value + '" is not permitted');
    }
    return value;
  },

  // Specify the direction of the ordering.
  direction: function direction(value) {
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    return orderBys.indexOf((value || '').toLowerCase()) !== -1 ? value : 'asc';
  },

  // Compiles a callback using the query builder.
  compileCallback: function compileCallback(callback, method) {
    var client = this.client;

    // Build the callback
    var builder = client.queryBuilder();
    callback.call(builder, builder);

    // Compile the callback, using the current formatter (to track all bindings).
    var compiler = client.queryCompiler(builder);
    compiler.formatter = this;

    // Return the compiled & parameterized sql.
    return compiler.toSQL(method || 'select');
  },

  // Ensures the query is aliased if necessary.
  outputQuery: function outputQuery(compiled, isParameter) {
    var sql = compiled.sql || '';
    if (sql) {
      if (compiled.method === 'select' && (isParameter || compiled.as)) {
        sql = '(' + sql + ')';
        if (compiled.as) return this.alias(sql, this.wrap(compiled.as));
      }
    }
    return sql;
  },

  // Coerce to string to prevent strange errors when it's not a string.
  _wrapString: function _wrapString(value) {
    var segments,
        asIndex = value.toLowerCase().indexOf(' as ');
    if (asIndex !== -1) {
      var first = value.slice(0, asIndex);
      var second = value.slice(asIndex + 4);
      return this.alias(this.wrap(first), this.wrapAsIdentifier(second));
    }
    var i = -1,
        wrapped = [];
    segments = value.split('.');
    while (++i < segments.length) {
      value = segments[i];
      if (i === 0 && segments.length > 1) {
        wrapped.push(this.wrap((value || '').trim()));
      } else {
        wrapped.push(this.client.wrapIdentifier((value || '').trim()));
      }
    }
    return wrapped.join('.');
  }

});

// Valid values for the `order by` clause generation.
var orderBys = ['asc', 'desc'];

// Turn this into a lookup map
var operators = transform(['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike', '&', '|', '^', '<<', '>>', 'rlike', 'regexp', 'not regexp', '~', '~*', '!~', '!~*', '#', '&&', '@>', '<@', '||'], function (obj, key) {
  obj[key] = true;
}, Object.create(null));

module.exports = Formatter;