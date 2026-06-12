const transform = require('lodash/transform');
const QueryBuilder = require('../query/querybuilder');
const { compileCallback, wrapAsIdentifier } = require('./formatterUtils');

// Valid values for the `order by` clause generation.
const orderBys = ['asc', 'desc'];

// Turn this into a lookup map
const operators = transform(
  [
    '=',
    '<',
    '>',
    '<=',
    '<=>',
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
    'match',
    'similar to',
    'not similar to',
    '&',
    '|',
    '^',
    '<<',
    '>>',
    '~',
    '~=',
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

// Accepts a string or array of columns to wrap as appropriate. Column can be raw
function columnize(target, builder, client, bindingHolder) {
  if (!Array.isArray(target)) {
    return wrap(target, undefined, builder, client, bindingHolder);
  }

  const columns = target;
  let str = '',
    i = -1;
  while (++i < columns.length) {
    if (i > 0) str += ', ';
    str += wrap(columns[i], undefined, builder, client, bindingHolder);
  }
  return str;
}

// Puts the appropriate wrapper around a value depending on the database
// engine, unless it's a knex.raw value, in which case it's left alone.
function wrap(value, isParameter, builder, client, bindingHolder) {
  const raw = unwrapRaw(value, isParameter, builder, client, bindingHolder);
  if (raw) return raw;
  switch (typeof value) {
    case 'function':
      return outputQuery(
        compileCallback(value, undefined, client, bindingHolder),
        true,
        builder,
        client
      );
    case 'object':
      return parseObject(value, builder, client, bindingHolder);
    case 'number':
      return value;
    default:
      return wrapString(value + '', builder, client);
  }
}

function unwrapRaw(value, isParameter, builder, client, bindingsHolder) {
  let query;
  if (value instanceof QueryBuilder) {
    query = client.queryCompiler(value).toSQL();
    if (query.bindings) {
      bindingsHolder.bindings.push(...query.bindings);
    }
    return outputQuery(query, isParameter, builder, client);
  }
  if (value && value.isRawInstance) {
    value.client = client;
    if (builder._queryContext) {
      value.queryContext = () => {
        return builder._queryContext;
      };
    }

    query = value.toSQL();
    if (query.bindings) {
      bindingsHolder.bindings.push(...query.bindings);
    }
    return query.sql;
  }
  if (isParameter) {
    bindingsHolder.bindings.push(value);
  }
}

function operator(value, builder, client, bindingsHolder) {
  const raw = unwrapRaw(value, undefined, builder, client, bindingsHolder);
  if (raw) return raw;
  const operator = operators[(value || '').toLowerCase()];
  if (!operator) {
    throw new TypeError(`The operator "${value}" is not permitted`);
  }
  return operator;
}

// Find a case-insensitive " as " without allocating a lowercased string.
// ASCII uppercase letters differ from lowercase by bit 0x20, so `| 32`
// folds A/S to a/s before comparing to 97 ("a") and 115 ("s").
function getAliasSeparatorIndex(value) {
  let i = -1;
  while ((i = value.indexOf(' ', i + 1)) !== -1) {
    if (
      i + 3 < value.length &&
      (value.charCodeAt(i + 1) | 32) === 97 &&
      (value.charCodeAt(i + 2) | 32) === 115 &&
      value.charCodeAt(i + 3) === 32
    ) {
      return i;
    }
  }
  return -1;
}

// Coerce to string to prevent strange errors when it's not a string.
function wrapString(value, builder, client) {
  const asIndex = getAliasSeparatorIndex(value);
  if (asIndex !== -1) {
    const first = value.slice(0, asIndex);
    const second = value.slice(asIndex + 4);
    return client.alias(
      wrapString(first, builder, client),
      wrapAsIdentifier(second, builder, client)
    );
  }

  let segmentStart = 0;
  let dotIndex = value.indexOf('.');

  if (dotIndex === -1) {
    return wrapAsIdentifier(value, builder, client);
  }

  let wrapped = '';
  let i = 0;

  while (dotIndex !== -1) {
    const segment = value.slice(segmentStart, dotIndex);
    if (i > 0) wrapped += '.';
    wrapped +=
      i === 0
        ? wrapString((segment || '').trim(), builder, client)
        : wrapAsIdentifier(segment, builder, client);
    segmentStart = dotIndex + 1;
    dotIndex = value.indexOf('.', segmentStart);
    i++;
  }

  return `${wrapped}.${wrapAsIdentifier(
    value.slice(segmentStart),
    builder,
    client
  )}`;
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
      ret.push(outputQuery(compiled, true, builder, client));
    } else if (queryOrIdentifier instanceof QueryBuilder) {
      ret.push(
        client.alias(
          `(${wrap(queryOrIdentifier, undefined, builder, client, formatter)})`,
          wrapAsIdentifier(alias, builder, client)
        )
      );
    } else {
      ret.push(
        client.alias(
          wrap(queryOrIdentifier, undefined, builder, client, formatter),
          wrapAsIdentifier(alias, builder, client)
        )
      );
    }
  }
  return ret.join(', ');
}

// Ensures the query is aliased if necessary.
function outputQuery(compiled, isParameter, builder, client) {
  let sql = compiled.sql || '';
  if (sql) {
    if (
      (compiled.method === 'select' || compiled.method === 'first') &&
      (isParameter || compiled.as)
    ) {
      sql = `(${sql})`;
      if (compiled.as)
        return client.alias(sql, wrapString(compiled.as, builder, client));
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
 * @param bindingHolder
 */
function rawOrFn(value, method, builder, client, bindingHolder) {
  if (typeof value === 'function') {
    return outputQuery(
      compileCallback(value, method, client, bindingHolder),
      undefined,
      builder,
      client
    );
  }
  return unwrapRaw(value, undefined, builder, client, bindingHolder) || '';
}

// Specify the direction of the ordering.
function direction(value, builder, client, bindingsHolder) {
  const raw = unwrapRaw(value, undefined, builder, client, bindingsHolder);
  if (raw) return raw;
  return orderBys.indexOf((value || '').toLowerCase()) !== -1 ? value : 'asc';
}

module.exports = {
  columnize,
  direction,
  operator,
  outputQuery,
  getAliasSeparatorIndex,
  rawOrFn,
  unwrapRaw,
  wrap,
  wrapString,
};
