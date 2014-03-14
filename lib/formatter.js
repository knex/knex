// Mixed into the query compiler & schema pieces. Assumes a `grammar`
// property exists on the current object.
module.exports = function(client, delimeter) {
  var _     = require('lodash');
  var Raw   = require('./raw');
  var FluentChain = require('fluent-chain');
  var push  = Array.prototype.push;

  // All operators used in the `where` clause generation.
  var operators = ['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike'];

  // Valid values for the `order by` clause generation.
  var orderBys  = ['asc', 'desc'];

  var Formatter = function() {
    this.bindings = [];
    this.errors   = [];
  };

  Formatter.prototype = {

    constructor: Formatter,

    // Wraps a value (column, tableName) with the correct ticks.
    wrapValue: function(value) {
      return (value !== '*' ? format(delimeter + '%s' + delimeter, value) : '*');
    },

    parameterize: function(values, joining) {
      if (_.isFunction(values)) return this.parameter(values);
      values = _.isArray(values) ? values : [values];
      return _.map(values, this.parameter, this).join(joining || ', ');
    },

    parameter: function(value) {
      if (_.isFunction(value)) {
        return '(' + this.compileCallback(value) + ')';
      }
      return this.checkRaw(value, true) || '?';
    },

    compileCallback: function(callback, method) {
      var builder = new client.Query();
      callback.call(builder, builder);
      var data = builder.toSql(method);
      push.apply(this.bindings, data.bindings);
      return data.sql;
    },

    checkRaw: function(value, parameter) {
      if (value instanceof FluentChain || value instanceof client.Query) {
        return this.checkRaw(new Raw(value));
      }
      if (value instanceof Raw) {
        if (value.bindings) push.apply(this.bindings, value.bindings);
        return value.sql;
      }
      if (parameter) this.bindings.push(value);
    },

    rawOrFn: function(value, wrap) {
      var sql = wrap ? '(' : '';
      if (_.isFunction(value)) {
        sql += this.compileCallback(value);
      } else {
        sql += this.checkRaw(value);
      }
      return sql + (wrap ? ')' : '');
    },

    // Puts the appropriate wrapper around a value depending on the database
    // engine, unless it's a knex.raw value, in which case it's left alone.
    wrap: function(val) {
      var raw, segments;
      if (raw = this.checkRaw(val)) return raw;
      if (_.isNumber(val)) return val;

      // Coerce to string to prevent strange errors when it's not a string.
      var value = val + '';
      var asIndex = value.toLowerCase().indexOf(' as ');

      // TODO: Check if this works with "AS"
      if (asIndex !== -1) {
        segments = value.split(' as ');
        return this.wrap(segments[0]) + ' as ' + this.wrap(segments[1]);
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
    },

    // Accepts a string or array of columns to wrap as appropriate.
    columnize: function(target) {
      var columns = (_.isString(target) ? [target] : target);
      return _.map(columns, this.wrap, this).join(', ');
    },

    // The operator method takes a value and returns something or other.
    operator: function(value) {
      var raw;
      if (raw = this.checkRaw(value)) return raw;
      if (!_.contains(operators, value)) {
        this.errors.push(new Error('The operator "' + value + '" is not permitted'));
      }
      return value;
    },

    direction: function(value) {
      var raw;
      if (raw = this.checkRaw(value)) return raw;
      return _.contains(orderBys, (value || '').toLowerCase()) ? value : 'asc';
    }

  };

  // The `format` function is borrowed from the Node.js `utils` module,
  // since we want to be able to have this functionality on the
  // frontend as well.
  function format(f) {
    var i;
    if (!_.isString(f)) {
      var objects = [];
      for (i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }
    i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
          break;
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (_.isNull(x) || !_.isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  }

  // Regex used in the `Helpers.format` function.
  var formatRegExp = /%[sdj%]/g;

  return Formatter;
};