'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _builder = require('./query/builder');

var _builder2 = _interopRequireDefault(_builder);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Valid values for the `order by` clause generation.
var orderBys = ['asc', 'desc'];

// Turn this into a lookup map
var operators = (0, _lodash.transform)(['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'not between', 'ilike', 'not ilike', 'exists', 'not exist', 'rlike', 'not rlike', 'regexp', 'not regexp', '&', '|', '^', '<<', '>>', '~', '~*', '!~', '!~*', '#', '&&', '@>', '<@', '||', '&<', '&>', '-|-', '@@', '!!', ['?', '\\?'], ['?|', '\\?|'], ['?&', '\\?&']], function (result, key) {
  if (Array.isArray(key)) {
    result[key[0]] = key[1];
  } else {
    result[key] = key;
  }
}, {});

var Formatter = function () {
  function Formatter(client, builder) {
    (0, _classCallCheck3.default)(this, Formatter);

    this.client = client;
    this.builder = builder;
    this.bindings = [];
  }

  // Accepts a string or array of columns to wrap as appropriate.


  Formatter.prototype.columnize = function columnize(target) {
    var columns = Array.isArray(target) ? target : [target];
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

  // Formats `values` into a parenthesized list of parameters for a `VALUES`
  // clause.
  //
  // [1, 2]                  -> '(?, ?)'
  // [[1, 2], [3, 4]]        -> '((?, ?), (?, ?))'
  // knex('table')           -> '(select * from "table")'
  // knex.raw('select ?', 1) -> '(select ?)'
  //


  Formatter.prototype.values = function values(_values) {
    var _this = this;

    if (Array.isArray(_values)) {
      if (Array.isArray(_values[0])) {
        return '(' + _values.map(function (value) {
          return '(' + _this.parameterize(value) + ')';
        }).join(', ') + ')';
      }
      return '(' + this.parameterize(_values) + ')';
    }

    if (_values instanceof _raw2.default) {
      return '(' + this.parameter(_values) + ')';
    }

    return this.parameter(_values);
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

  /**
   * Creates SQL for a parameter, which might be passed to where() or .with() or
   * pretty much anywhere in API.
   *
   * @param query Callback (for where or complete builder), Raw or QueryBuilder
   * @param method Optional at least 'select' or 'update' are valid
   */


  Formatter.prototype.rawOrFn = function rawOrFn(value, method) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value, method));
    }
    return this.unwrapRaw(value) || '';
  };

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.


  Formatter.prototype.wrap = function wrap(value) {
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    switch (typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) {
      case 'function':
        return this.outputQuery(this.compileCallback(value), true);
      case 'object':
        return this.parseObject(value);
      case 'number':
        return value;
      default:
        return this.wrapString(value + '');
    }
  };

  Formatter.prototype.wrapAsIdentifier = function wrapAsIdentifier(value) {
    var queryContext = this.builder.queryContext();
    return this.client.wrapIdentifier((value || '').trim(), queryContext);
  };

  Formatter.prototype.alias = function alias(first, second) {
    return first + ' as ' + second;
  };

  Formatter.prototype.operator = function operator(value) {
    var raw = this.unwrapRaw(value);
    if (raw) return raw;
    var operator = operators[(value || '').toLowerCase()];
    if (!operator) {
      throw new TypeError('The operator "' + value + '" is not permitted');
    }
    return operator;
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
    return compiler.toSQL(method || builder._method || 'select');
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

  // Key-value notation for alias


  Formatter.prototype.parseObject = function parseObject(obj) {
    var ret = [];
    for (var alias in obj) {
      var queryOrIdentifier = obj[alias];
      // Avoids double aliasing for subqueries
      if (typeof queryOrIdentifier === 'function') {
        var compiled = this.compileCallback(queryOrIdentifier);
        compiled.as = alias; // enforces the object's alias
        ret.push(this.outputQuery(compiled, true));
      } else if (queryOrIdentifier instanceof _builder2.default) {
        ret.push(this.alias('(' + this.wrap(queryOrIdentifier) + ')', this.wrapAsIdentifier(alias)));
      } else {
        ret.push(this.alias(this.wrap(queryOrIdentifier), this.wrapAsIdentifier(alias)));
      }
    }
    return ret.join(', ');
  };

  // Coerce to string to prevent strange errors when it's not a string.


  Formatter.prototype.wrapString = function wrapString(value) {
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
        wrapped.push(this.wrapAsIdentifier(value));
      }
    }
    return wrapped.join('.');
  };

  return Formatter;
}();

exports.default = Formatter;
module.exports = exports['default'];