const transform = require('lodash/transform');
const Raw = require('../raw');
const QueryBuilder = require('../query/builder');
const { compileCallback } = require('./formatterUtils');

// Turn this into a lookup map
const operators = transform(
  [
    '=',
    '<',
    '>',
    '<=',
    '>=',
    '<>',
    '!=',
    'like',
    'not like',
    'between',
    'not between',
    'ilike',
    'not ilike',
    'exists',
    'not exist',
    'rlike',
    'not rlike',
    'regexp',
    'not regexp',
    '&',
    '|',
    '^',
    '<<',
    '>>',
    '~',
    '~*',
    '!~',
    '!~*',
    '#',
    '&&',
    '@>',
    '<@',
    '||',
    '&<',
    '&>',
    '-|-',
    '@@',
    '!!',
    ['?', '\\?'],
    ['?|', '\\?|'],
    ['?&', '\\?&'],
  ],
  (result, key) => {
    if (Array.isArray(key)) {
      result[key[0]] = key[1];
    } else {
      result[key] = key;
    }
  },
  {}
);

// Accepts a string or array of columns to wrap as appropriate.
function columnize(target, builder, client, formatter) {
  const columns = Array.isArray(target) ? target : [target];
  let str = '',
    i = -1;
  while (++i < columns.length) {
    if (i > 0) str += ', ';
    str += wrap(columns[i], undefined, builder, client, formatter);
  }
  return str;
}

// Puts the appropriate wrapper around a value depending on the database
// engine, unless it's a knex.raw value, in which case it's left alone.
function wrap(value, isParameter, builder, client, formatter) {
  const raw = unwrapRaw(value, isParameter, builder, client, formatter);
  if (raw) return raw;
  switch (typeof value) {
    case 'function':
      return outputQuery(
        compileCallback(value, undefined, client, formatter),
        true,
        builder,
        client,
        formatter
      );
    case 'object':
      return parseObject(value, builder, client, formatter);
    case 'number':
      return value;
    default:
      return wrapString(value + '', builder, client, formatter);
  }
}

function unwrapRaw(value, isParameter, builder, client, formatter) {
  let query;
  if (value instanceof QueryBuilder) {
    query = client.queryCompiler(value).toSQL();
    if (query.bindings) {
      formatter.bindings = formatter.bindings.concat(query.bindings);
    }
    return outputQuery(query, isParameter, builder, client, formatter);
  }
  if (value instanceof Raw) {
    value.client = client;
    if (builder._queryContext) {
      value.queryContext = () => {
        return this._queryContext;
      };
    }

    query = value.toSQL();
    if (query.bindings) {
      formatter.bindings = formatter.bindings.concat(query.bindings);
    }
    return query.sql;
  }
  if (isParameter) {
    formatter.bindings.push(value);
  }
}

function operator(value, builder, client, formatter) {
  const raw = unwrapRaw(value, undefined, builder, client, formatter);
  if (raw) return raw;
  const operator = operators[(value || '').toLowerCase()];
  if (!operator) {
    throw new TypeError(`The operator "${value}" is not permitted`);
  }
  return operator;
}

function wrapString(value, builder, client, formatter) {
  const asIndex = value.toLowerCase().indexOf(' as ');
  if (asIndex !== -1) {
    const first = value.slice(0, asIndex);
    const second = value.slice(asIndex + 4);
    return formatter.alias(
      wrap(first, undefined, builder, client, formatter),
      wrapAsIdentifier(second, builder, client)
    );
  }
  const wrapped = [];
  let i = -1;
  const segments = value.split('.');
  while (++i < segments.length) {
    value = segments[i];
    if (i === 0 && segments.length > 1) {
      wrapped.push(
        wrap((value || '').trim(), undefined, builder, client, formatter)
      );
    } else {
      wrapped.push(wrapAsIdentifier(value, builder, client));
    }
  }
  return wrapped.join('.');
}

function wrapAsIdentifier(value, builder, client) {
  const queryContext = builder.queryContext();
  return client.wrapIdentifier((value || '').trim(), queryContext);
}

// Key-value notation for alias
function parseObject(obj, builder, client, formatter) {
  const ret = [];
  for (const alias in obj) {
    const queryOrIdentifier = obj[alias];
    // Avoids double aliasing for subqueries
    if (typeof queryOrIdentifier === 'function') {
      const compiled = compileCallback(
        queryOrIdentifier,
        undefined,
        client,
        formatter
      );
      compiled.as = alias; // enforces the object's alias
      ret.push(outputQuery(compiled, true, builder, client, formatter));
    } else if (queryOrIdentifier instanceof QueryBuilder) {
      ret.push(
        formatter.alias(
          `(${wrap(queryOrIdentifier, builder, client, formatter)})`,
          wrapAsIdentifier(alias, builder, client)
        )
      );
    } else {
      ret.push(
        formatter.alias(
          wrap(queryOrIdentifier, undefined, builder, client, formatter),
          wrapAsIdentifier(alias, builder, client)
        )
      );
    }
  }
  return ret.join(', ');
}

// Ensures the query is aliased if necessary.
function outputQuery(compiled, isParameter, builder, client, formatter) {
  let sql = compiled.sql || '';
  if (sql) {
    if (
      (compiled.method === 'select' || compiled.method === 'first') &&
      (isParameter || compiled.as)
    ) {
      sql = `(${sql})`;
      if (compiled.as)
        return formatter.alias(
          sql,
          wrap(compiled.as, builder, client, formatter)
        );
    }
  }
  return sql;
}

/**
 * Creates SQL for a parameter, which might be passed to where() or .with() or
 * pretty much anywhere in API.
 *
 * @param value
 * @param method Optional at least 'select' or 'update' are valid
 * @param builder
 * @param client
 * @param formatter
 */
function rawOrFn(value, method, builder, client, formatter) {
  if (typeof value === 'function') {
    return outputQuery(compileCallback(value, method, client, formatter));
  }
  return unwrapRaw(value, undefined, builder, client, formatter) || '';
}

module.exports = {
  columnize,
  operator,
  outputQuery,
  rawOrFn,
  unwrapRaw,
  wrap,
  wrapAsIdentifier,
  wrapString,
};
