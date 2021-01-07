// Compiles a callback using the query builder.
function compileCallback(callback, method, client, formatter) {
  // Build the callback
  const builder = client.queryBuilder();
  callback.call(builder, builder);

  // Compile the callback, using the current formatter (to track all bindings).
  const compiler = client.queryCompiler(builder, formatter);

  // Return the compiled & parameterized sql.
  return compiler.toSQL(method || builder._method || 'select');
}

function wrapAsIdentifier(value, builder, client) {
  const queryContext = builder.queryContext();
  return client.wrapIdentifier((value || '').trim(), queryContext);
}

module.exports = {
  compileCallback,
  wrapAsIdentifier,
};
