function compileCreateTable(ast, wrap = (v) => v) {
  return createTable(ast, wrap);
}

function compileCreateIndex(ast, wrap = (v) => v) {
  return createIndex(ast, wrap);
}

function createTable(ast, wrap) {
  return `CREATE${temporary(ast, wrap)} TABLE${exists(ast, wrap)} ${schema(
    ast,
    wrap
  )}${table(ast, wrap)} (${columnDefinitionList(
    ast,
    wrap
  )}${tableConstraintList(ast, wrap)})${rowid(ast, wrap)}`;
}

function temporary(ast, wrap) {
  return ast.temporary ? ' TEMP' : '';
}

function rowid(ast, wrap) {
  return ast.rowid ? ' WITHOUT ROWID' : '';
}

function columnDefinitionList(ast, wrap) {
  return ast.columns.map((column) => columnDefinition(column, wrap)).join(', ');
}

function columnDefinition(ast, wrap) {
  return `${identifier(ast.name, wrap)}${typeName(
    ast,
    wrap
  )}${columnConstraintList(ast.constraints, wrap)}`;
}

function typeName(ast, wrap) {
  return ast.type !== null ? ` ${ast.type}` : '';
}

function columnConstraintList(ast, wrap) {
  return `${primaryColumnConstraint(ast, wrap)}${notnullColumnConstraint(
    ast,
    wrap
  )}${nullColumnConstraint(ast, wrap)}${uniqueColumnConstraint(
    ast,
    wrap
  )}${checkColumnConstraint(ast, wrap)}${defaultColumnConstraint(
    ast,
    wrap
  )}${collateColumnConstraint(ast, wrap)}${referencesColumnConstraint(
    ast,
    wrap
  )}${asColumnConstraint(ast, wrap)}`;
}

function primaryColumnConstraint(ast, wrap) {
  return ast.primary !== null
    ? ` ${constraintName(ast.primary, wrap)}PRIMARY KEY${order(
        ast.primary,
        wrap
      )}${conflictClause(ast.primary, wrap)}${autoincrement(ast.primary, wrap)}`
    : '';
}

function autoincrement(ast, wrap) {
  return ast.autoincrement ? ' AUTOINCREMENT' : '';
}

function notnullColumnConstraint(ast, wrap) {
  return ast.notnull !== null
    ? ` ${constraintName(ast.notnull, wrap)}NOT NULL${conflictClause(
        ast.notnull,
        wrap
      )}`
    : '';
}

function nullColumnConstraint(ast, wrap) {
  return ast.null !== null
    ? ` ${constraintName(ast.null, wrap)}NULL${conflictClause(ast.null, wrap)}`
    : '';
}

function uniqueColumnConstraint(ast, wrap) {
  return ast.unique !== null
    ? ` ${constraintName(ast.unique, wrap)}UNIQUE${conflictClause(
        ast.unique,
        wrap
      )}`
    : '';
}

function checkColumnConstraint(ast, wrap) {
  return ast.check !== null
    ? ` ${constraintName(ast.check, wrap)}CHECK (${expression(
        ast.check.expression,
        wrap
      )})`
    : '';
}

function defaultColumnConstraint(ast, wrap) {
  return ast.default !== null
    ? ` ${constraintName(ast.default, wrap)}DEFAULT ${
        !ast.default.expression
          ? ast.default.value
          : `(${expression(ast.default.value, wrap)})`
      }`
    : '';
}

function collateColumnConstraint(ast, wrap) {
  return ast.collate !== null
    ? ` ${constraintName(ast.collate, wrap)}COLLATE ${ast.collate.collation}`
    : '';
}

function referencesColumnConstraint(ast, wrap) {
  return ast.references !== null
    ? ` ${constraintName(ast.references, wrap)}${foreignKeyClause(
        ast.references,
        wrap
      )}`
    : '';
}

function asColumnConstraint(ast, wrap) {
  return ast.as !== null
    ? ` ${constraintName(ast.as, wrap)}${
        ast.as.generated ? 'GENERATED ALWAYS ' : ''
      }AS (${expression(ast.as.expression, wrap)})${
        ast.as.mode !== null ? ` ${ast.as.mode}` : ''
      }`
    : '';
}

function tableConstraintList(ast, wrap) {
  return ast.constraints.reduce(
    (constraintList, constraint) =>
      `${constraintList}, ${tableConstraint(constraint, wrap)}`,
    ''
  );
}

function tableConstraint(ast, wrap) {
  switch (ast.type) {
    case 'PRIMARY KEY':
      return primaryTableConstraint(ast, wrap);
    case 'UNIQUE':
      return uniqueTableConstraint(ast, wrap);
    case 'CHECK':
      return checkTableConstraint(ast, wrap);
    case 'FOREIGN KEY':
      return foreignTableConstraint(ast, wrap);
  }
}

function primaryTableConstraint(ast, wrap) {
  return `${constraintName(ast, wrap)}PRIMARY KEY (${indexedColumnList(
    ast,
    wrap
  )})${conflictClause(ast, wrap)}`;
}

function uniqueTableConstraint(ast, wrap) {
  return `${constraintName(ast, wrap)}UNIQUE (${indexedColumnList(
    ast,
    wrap
  )})${conflictClause(ast, wrap)}`;
}

function conflictClause(ast, wrap) {
  return ast.conflict !== null ? ` ON CONFLICT ${ast.conflict}` : '';
}

function checkTableConstraint(ast, wrap) {
  return `${constraintName(ast, wrap)}CHECK (${expression(
    ast.expression,
    wrap
  )})`;
}

function foreignTableConstraint(ast, wrap) {
  return `${constraintName(ast, wrap)}FOREIGN KEY (${columnNameList(
    ast,
    wrap
  )}) ${foreignKeyClause(ast.references, wrap)}`;
}

function foreignKeyClause(ast, wrap) {
  return `REFERENCES ${table(ast, wrap)}${columnNameListOptional(
    ast,
    wrap
  )}${deleteUpdateMatchList(ast, wrap)}${deferrable(ast.deferrable, wrap)}`;
}

function columnNameListOptional(ast, wrap) {
  return ast.columns.length > 0 ? ` (${columnNameList(ast, wrap)})` : '';
}

function columnNameList(ast, wrap) {
  return ast.columns.map((column) => identifier(column, wrap)).join(', ');
}

function deleteUpdateMatchList(ast, wrap) {
  return `${deleteReference(ast, wrap)}${updateReference(
    ast,
    wrap
  )}${matchReference(ast, wrap)}`;
}

function deleteReference(ast, wrap) {
  return ast.delete !== null ? ` ON DELETE ${ast.delete}` : '';
}

function updateReference(ast, wrap) {
  return ast.update !== null ? ` ON UPDATE ${ast.update}` : '';
}

function matchReference(ast, wrap) {
  return ast.match !== null ? ` MATCH ${ast.match}` : '';
}

function deferrable(ast, wrap) {
  return ast !== null
    ? ` ${ast.not ? 'NOT ' : ''}DEFERRABLE${
        ast.initially !== null ? ` INITIALLY ${ast.initially}` : ''
      }`
    : '';
}

function constraintName(ast, wrap) {
  return ast.name !== null ? `CONSTRAINT ${identifier(ast.name, wrap)} ` : '';
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
  compileCreateTable,
  compileCreateIndex,
};
