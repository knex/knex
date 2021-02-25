const { COMMA_NO_PAREN_REGEX } = require('../../../../constants');

const IDENTIFIER = /^(?<open>"|`|\[)?(?<identifier>(?<=").*(?=")|(?<=`).*(?=`)|(?<=\[).*(?=\])|(?<=^)\w+(?=$))(?<close>"|`|\])?$/i;

function parseCreateIndex(sql) {
  const normalized = sql.replace(/\s+/g, ' ');

  const createIndexStatement = parse(
    normalized,
    /^CREATE(?<unique> UNIQUE)? INDEX(?<exists> IF NOT EXISTS)? (?:(?<schema>[^.]+)\.)?(?<index>[^.]+) ON (?<table>.+?) ?\((?<columns>.+)\)(?: WHERE (?<where>.+))?$/i
  );

  const unique = createIndexStatement.unique !== undefined;
  const exists = createIndexStatement.exists !== undefined;
  const schema = createIndexStatement.schema
    ? parse(createIndexStatement.schema, IDENTIFIER).identifier
    : null;
  const index = parse(createIndexStatement.index, IDENTIFIER).identifier;
  const table = parse(createIndexStatement.table, IDENTIFIER).identifier;
  const where = createIndexStatement.where || null;

  const columns = createIndexStatement.columns
    .split(COMMA_NO_PAREN_REGEX)
    .map((column) => {
      const normalized = column.trim();

      const indexedColumn = parse(
        normalized,
        /^(?<name>.+?)(?: COLLATE (?<collation>\w+))?(?: (?<order>ASC|DESC))?$/i
      );

      const expression = !IDENTIFIER.test(indexedColumn.name);
      const name = !expression
        ? parse(indexedColumn.name, IDENTIFIER).identifier
        : indexedColumn.name;
      const collation = indexedColumn.collation || null;
      const order = indexedColumn.order
        ? indexedColumn.order.toUpperCase()
        : null;

      return { name, expression, collation, order };
    });

  return { unique, exists, schema, index, table, columns, where };
}

function parse(sql, regex) {
  const result = sql.match(regex);

  if (result === null) {
    throw new Error('Parsing SQL command failed');
  }
  return result.groups;
}

module.exports = {
  parseCreateIndex,
};
