function compileCreateIndex(ast, wrap = (v) => v) {
  const columns = ast.columns
    .map((column) => {
      return `${!column.expression ? wrap(column.name) : column.name}${
        column.collation ? ` COLLATE ${column.collation}` : ''
      }${column.order ? ` ${column.order}` : ''}`;
    })
    .join(', ');

  return `CREATE${ast.unique ? ' UNIQUE' : ''} INDEX${
    ast.exists ? ' IF NOT EXISTS' : ''
  } ${ast.schema ? `${wrap(ast.schema)}.` : ''}${wrap(ast.index)} on ${wrap(
    ast.table
  )} (${columns})${ast.where ? ` where ${ast.where}` : ''}`;
}

module.exports = {
  compileCreateIndex,
};
