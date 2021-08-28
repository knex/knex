function createNewTable(sql, tablename, alteredName) {
  return sql.replace(tablename, alteredName);
}

function copyData(sourceTable, targetTable, columns) {
  return `INSERT INTO ${targetTable} SELECT ${
    columns === undefined
      ? '*'
      : columns.map((column) => `"${column}"`).join(', ')
  } FROM ${sourceTable};`;
}

function dropOriginal(tableName) {
  return `DROP TABLE "${tableName}"`;
}

function renameTable(tableName, alteredName) {
  return `ALTER TABLE "${tableName}" RENAME TO "${alteredName}"`;
}

function getTableSql(tableName) {
  return `SELECT type, sql FROM sqlite_master WHERE (type="table" OR (type="index" AND sql IS NOT NULL)) AND tbl_name="${tableName}"`;
}

module.exports = {
  createNewTable,
  copyData,
  dropOriginal,
  renameTable,
  getTableSql,
};
