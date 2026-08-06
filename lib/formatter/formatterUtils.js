const { isObject } = require('../util/is');

// Compiles a callback using the query builder.
function compileCallback(callback, method, client, bindingsHolder) {
  // Build the callback
  const builder = client.queryBuilder();
  callback.call(builder, builder);

  // Compile the callback, using the current formatter (to track all bindings).
  const compiler = client.queryCompiler(builder, bindingsHolder.bindings);

  // Return the compiled & parameterized sql.
  return compiler.toSQL(method || builder._method || 'select');
}

function wrapAsIdentifier(value, builder, client) {
  const queryContext = builder.queryContext();
  return client.wrapIdentifier((value || '').trim(), queryContext);
}

function formatDefault(value, type, client) {
  if (value === void 0) {
    return '';
  } else if (value === null) {
    return 'null';
  } else if (value && value.isRawInstance) {
    return value.toQuery();
  } else if (type === 'bool') {
    if (value === 'false') value = 0;
    return `'${value ? 1 : 0}'`;
  } else if ((type === 'json' || type === 'jsonb') && isObject(value)) {
    // JSON.stringify is not SQL-safe: object values can embed single quotes
    // (e.g. {"x":"a'b"}) which break out of the string literal and allow
    // SQL injection in DDL/default paths (CWE-89).
    // See https://github.com/knex/knex/issues/6509
    return client._escapeBinding(JSON.stringify(value));
  } else {
    return client._escapeBinding(value.toString());
  }
}

module.exports = {
  compileCallback,
  wrapAsIdentifier,
  formatDefault,
};
