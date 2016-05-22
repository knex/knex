
import QueryBuilder from './query/builder';
import Raw from './raw';

import { assign, transform } from 'lodash'

// Valid values for the `order by` clause generation.
const orderBys = ['asc', 'desc'];

// Turn this into a lookup map
const operators = transform([
  '=', '<', '>', '<=', '>=', '<>', '!=', 'like',
  'not like', 'between', 'ilike', '&', '|', '^', '<<', '>>',
  'rlike', 'regexp', 'not regexp', '~', '~*', '!~', '!~*',
  '#', '&&', '@>', '<@', '||'
], (result, key) => {
  result[key] = true
}, {});

function Formatter(client) {
  this.client = client
  this.bindings = []
}

assign(Formatter.prototype, {

  // Accepts a string or array of columns to wrap as appropriate.
  columnize(target) {
    const columns = typeof target === 'string' ? [target] : target
    let str = '', i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', '
      str += this.wrap(columns[i])
    }
    return str
  },

  // Turns a list of values into a list of ?'s, joining them with commas unless
  // a "joining" value is specified (e.g. ' and ')
  parameterize(values, notSetValue) {
    if (typeof values === 'function') return this.parameter(values);
    values = Array.isArray(values) ? values : [values];
    let str = '', i = -1;
    while (++i < values.length) {
      if (i > 0) str += ', '
      str += this.parameter(values[i] === undefined ? notSetValue : values[i])
    }
    return str;
  },

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    }
    return this.unwrapRaw(value, true) || '?';
  },

  unwrapRaw(value, isParameter) {
    let query;
    if (value instanceof QueryBuilder) {
      query = this.client.queryCompiler(value).toSQL()
      if (query.bindings) {
        this.bindings = this.bindings.concat(query.bindings);
      }
      return this.outputQuery(query, isParameter);
    }
    if (value instanceof Raw) {
      value.client = this.client;
      query = value.toSQL()
      if (query.bindings) {
        this.bindings = this.bindings.concat(query.bindings);
      }
      return query.sql
    }
    if (isParameter) {
      this.bindings.push(value);
    }
  },

  rawOrFn(value, method) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value, method));
    }
    return this.unwrapRaw(value) || '';
  },

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.
  wrap(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    }
    const raw = this.unwrapRaw(value);
    if (raw) return raw;
    if (typeof value === 'number') return value;
    return this._wrapString(value + '');
  },

  wrapAsIdentifier(value) {
    return this.client.wrapIdentifier((value || '').trim());
  },

  alias(first, second) {
    return first + ' as ' + second;
  },

  // The operator method takes a value and returns something or other.
  operator(value) {
    const raw = this.unwrapRaw(value);
    if (raw) return raw;
    if (operators[(value || '').toLowerCase()] !== true) {
      throw new TypeError(`The operator "${value}" is not permitted`);
    }
    return value;
  },

  // Specify the direction of the ordering.
  direction(value) {
    const raw = this.unwrapRaw(value);
    if (raw) return raw;
    return orderBys.indexOf((value || '').toLowerCase()) !== -1 ? value : 'asc';
  },

  // Compiles a callback using the query builder.
  compileCallback(callback, method) {
    const { client } = this;

    // Build the callback
    const builder = client.queryBuilder();
    callback.call(builder, builder);

    // Compile the callback, using the current formatter (to track all bindings).
    const compiler = client.queryCompiler(builder);
    compiler.formatter = this;

    // Return the compiled & parameterized sql.
    return compiler.toSQL(method || 'select');
  },

  // Ensures the query is aliased if necessary.
  outputQuery(compiled, isParameter) {
    let sql = compiled.sql || '';
    if (sql) {
      if (compiled.method === 'select' && (isParameter || compiled.as)) {
        sql = `(${sql})`;
        if (compiled.as) return this.alias(sql, this.wrap(compiled.as))
      }
    }
    return sql;
  },

  // Coerce to string to prevent strange errors when it's not a string.
  _wrapString(value) {
    const asIndex = value.toLowerCase().indexOf(' as ');
    if (asIndex !== -1) {
      const first = value.slice(0, asIndex)
      const second = value.slice(asIndex + 4)
      return this.alias(this.wrap(first), this.wrapAsIdentifier(second))
    }
    const wrapped = [];
    let i = -1;
    const segments = value.split('.');
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

export default Formatter;
