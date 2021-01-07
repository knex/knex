// Compiles a callback using the query builder.
function compileCallback(callback, method, client, formatter) {
  // Build the callback
  const builder = client.queryBuilder();
  callback.call(builder, builder);

  // Compile the callback, using the current formatter (to track all bindings).
  const compiler = client.queryCompiler(builder);
  compiler.formatter = formatter;

  // Return the compiled & parameterized sql.
  return compiler.toSQL(method || builder._method || 'select');
}

module.exports = {
  compileCallback,
};
