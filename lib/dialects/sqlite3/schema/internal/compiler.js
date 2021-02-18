function compileCreateIndex(ast, wrap = (v) => v) {
  return createIndex(ast, wrap);
}

function createIndex(ast, wrap) {
  return `CREATE${unique(ast, wrap)} INDEX${exists(ast, wrap)} ${schema(
    ast,
    wrap
  )}${index(ast, wrap)} on ${table(ast, wrap)} (${indexedColumnList(
    ast,
    wrap
  )})${where(ast, wrap)}`;
}

function unique(ast, wrap) {
  return ast.unique ? ' UNIQUE' : '';
}

function exists(ast, wrap) {
  return ast.exists ? ' IF NOT EXISTS' : '';
}

function schema(ast, wrap) {
  return ast.schema !== null ? `${identifier(ast.schema, wrap)}.` : '';
}

function index(ast, wrap) {
  return identifier(ast.index, wrap);
}

function table(ast, wrap) {
  return identifier(ast.table, wrap);
}

function where(ast, wrap) {
  return ast.where !== null ? ` where ${expression(ast.where)}` : '';
}

function indexedColumnList(ast, wrap) {
  return ast.columns
    .map((column) =>
      !column.expression
        ? indexedColumn(column, wrap)
        : indexedColumnExpression(column, wrap)
    )
    .join(', ');
}

function indexedColumn(ast, wrap) {
  return `${identifier(ast.name, wrap)}${collation(ast, wrap)}${order(
    ast,
    wrap
  )}`;
}

function indexedColumnExpression(ast, wrap) {
  return `${indexedExpression(ast.name, wrap)}${collation(ast, wrap)}${order(
    ast,
    wrap
  )}`;
}

function collation(ast, wrap) {
  return ast.collation !== null ? ` COLLATE ${ast.collation}` : '';
}

function order(ast, wrap) {
  return ast.order !== null ? ` ${ast.order}` : '';
}

function indexedExpression(ast, wrap) {
  return expression(ast, wrap);
}

function expression(ast, wrap) {
  return ast.reduce(
    (expr, e) =>
      Array.isArray(e)
        ? `${expr}(${expression(e)})`
        : !expr
        ? e
        : `${expr} ${e}`,
    ''
  );
}

function identifier(ast, wrap) {
  return wrap(ast);
}

module.exports = {
  compileCreateIndex,
};
