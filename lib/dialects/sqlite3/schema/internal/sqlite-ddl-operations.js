const identity = require('lodash/identity');
const chunk = require('lodash/chunk');

function insertChunked(trx, chunkSize, target, iterator, existingData) {
  const result = [];
  iterator = iterator || identity;
  const chunked = chunk(existingData, chunkSize);
  for (const batch of chunked) {
    result.push(
      trx.queryBuilder().table(target).insert(batch.map(iterator)).toQuery()
    );
  }
  return result;
}

function createNewTable(sql, tablename, alteredName) {
  return sql.replace(tablename, alteredName);
}

// ToDo To be removed
async function copyData(trx, iterator, tableName, alteredName) {
  const existingData = await trx.raw(`SELECT * FROM "${tableName}"`);
  return insertChunked(trx, 20, alteredName, iterator, existingData);
}

function copyAllData(sourceTable, targetTable) {
  return `INSERT INTO ${targetTable} SELECT * FROM ${sourceTable};`;
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
  copyAllData,
  createNewTable,
  dropOriginal,
  copyData,
  renameTable,
  getTableSql,
};
