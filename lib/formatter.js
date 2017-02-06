'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _transform2 = require('lodash/transform');

var _transform3 = _interopRequireDefault(_transform2);

var _builder = require('./query/builder');

var _builder2 = _interopRequireDefault(_builder);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Valid values for the `order by` clause generation.
var orderBys = ['asc', 'desc'];

// Turn this into a lookup map
var operators = (0, _transform3.default)(['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike', '&', '|', '^', '<<', '>>', 'rlike', 'regexp', 'not regexp', '~', '~*', '!~', '!~*', '#', '&&', '@>', '<@', '||'], function (result, key) {
  result[key] = true;
}, {});

var Formatter = function () {
  function Formatter(client) {
    (0, _classCallCheck3.default)(this, Formatter);

    this.client = client;
    this.bindings = [];
  }

  // Accepts a string or array of columns to wrap as appropriate.


  Formatter.prototype.columnize = function columnize(target) {
    var columns = typeof target === 'string' ? [target] : target;
    var str = '',
        i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += this.wrap(columns[i]);
    }
    return str;
  };

  // Turns a list of values into a list of ?'s, joining them with commas unless
  // a "joining" value is specified (e.g. ' and ')


  Formatter.prototype.parameterize = function parameterize(values, notSetValue) {
    if (typeof values === 'function') return this.parameter(values);
    values = Array.isArray(values) ? values : [values];
    var str = '',
        i = -1;
    while (++i < values.length) {
      if (i > 0) str += ', ';
      str += this.parameter(values[i] === undefined ? notSetValue : values[i]);
    }
    return str;
  };

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw


  Formatter.prototype.parameter = function parameter(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    }
    return this.unwrapRaw(value, true) || '?';
  };

  Formatter.prototype.unwrapRaw = function unwrapRaw(value, isParameter) {
    var query = void 0;
    if (value instanceof _builder2.default) {
      query = this.client.queryCompiler(value).toSQL();
      if (query.bindings) {
        this.bindings = this.bindings.concat(query.bindings);
      }
      return this.outputQuery(query, isParameter);
    }
    if (value instanceof _raw2.default) {
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
  };

  Formatter.prototype.rawOrFn = function rawOrFn(value, method) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value, method));
    }
    return this.unwrapRaw(value) || '';
  };

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.


  Formatter.prototype.wrap = function wrap(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    }
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    if (typeof value === 'number') return value;
    return this._wrapString(value + '');
  };

  Formatter.prototype.wrapAsIdentifier = function wrapAsIdentifier(value) {
    return this.client.wrapIdentifier((value || '').trim());
  };

  Formatter.prototype.alias = function alias(first, second) {
    return first + ' as ' + second;
  };

  // The operator method takes a value and returns something or other.


  Formatter.prototype.operator = function operator(value) {
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    if (operators[(value || '').toLowerCase()] !== true) {
      throw new TypeError('The operator "' + value + '" is not permitted');
    }
    return value;
  };

  // Specify the direction of the ordering.


  Formatter.prototype.direction = function direction(value) {
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    return orderBys.indexOf((value || '').toLowerCase()) !== -1 ? value : 'asc';
  };

  // Compiles a callback using the query builder.


  Formatter.prototype.compileCallback = function compileCallback(callback, method) {
    var client = this.client;

    // Build the callback

    var builder = client.queryBuilder();
    callback.call(builder, builder);

    // Compile the callback, using the current formatter (to track all bindings).
    var compiler = client.queryCompiler(builder);
    compiler.formatter = this;

    // Return the compiled & parameterized sql.
    return compiler.toSQL(method || 'select');
  };

  // Ensures the query is aliased if necessary.


  Formatter.prototype.outputQuery = function outputQuery(compiled, isParameter) {
    var sql = compiled.sql || '';
    if (sql) {
      if ((compiled.method === 'select' || compiled.method === 'first') && (isParameter || compiled.as)) {
        sql = '(' + sql + ')';
        if (compiled.as) return this.alias(sql, this.wrap(compiled.as));
      }
    }
    return sql;
  };

  // Coerce to string to prevent strange errors when it's not a string.


  Formatter.prototype._wrapString = function _wrapString(value) {
    var asIndex = value.toLowerCase().indexOf(' as ');
    if (asIndex !== -1) {
      var first = value.slice(0, asIndex);
      var second = value.slice(asIndex + 4);
      return this.alias(this.wrap(first), this.wrapAsIdentifier(second));
    }
    var wrapped = [];
    var i = -1;
    var segments = value.split('.');
    while (++i < segments.length) {
      value = segments[i];
      if (i === 0 && segments.length > 1) {
        wrapped.push(this.wrap((value || '').trim()));
      } else {
        wrapped.push(this.client.wrapIdentifier((value || '').trim()));
      }
    }
    return wrapped.join('.');
  };

  return Formatter;
}();

exports.default = Formatter;
module.exports = exports['default'];