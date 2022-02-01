function copyData(sourceTable, targetTable, columns) {
  return `INSERT INTO "${targetTable}" SELECT ${
    columns === undefined
      ? '*'
      : columns.map((column) => `"${column}"`).join(', ')
  } FROM "${sourceTable}";`;
}

function dropOriginal(tableName) {
  return `DROP TABLE "${tableName}"`;
}

function renameTable(tableName, alteredName) {
  return `ALTER TABLE "${tableName}" RENAME TO "${alteredName}"`;
}

function getTableSql(tableName) {
  return `SELECT type, sql FROM sqlite_master WHERE (type='table' OR (type='index' AND sql IS NOT NULL)) AND tbl_name='${tableName}'`;
}

function isForeignCheckEnabled() {
  return `PRAGMA foreign_keys`;
}

function setForeignCheck(enable) {
  return `PRAGMA foreign_keys = ${enable ? 'ON' : 'OFF'}`;
}

function executeForeignCheck() {
  return `PRAGMA foreign_key_check`;
}

module.exports = {
  copyData,
  dropOriginal,
  renameTable,
  getTableSql,
  isForeignCheckEnabled,
  setForeignCheck,
  executeForeignCheck,
};
