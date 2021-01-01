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

function createTempTable(createTable, tablename, alteredName) {
  return createTable.sql.replace(tablename, alteredName);
}

// ToDo To be removed
async function copyData(trx, tableName, alteredName) {
  const existingData = await trx.raw(`SELECT * FROM "${tableName}"`);
  return insertChunked(trx, 20, alteredName, identity, existingData);
}

// ToDo To be removed
async function reinsertData(trx, iterator, tableName, alteredName) {
  const existingData = await trx.raw(`SELECT * FROM "${alteredName}"`);
  return insertChunked(trx, 20, tableName, iterator, existingData);
}

function copyAllData(sourceTable, targetTable) {
  return `INSERT INTO ${targetTable} SELECT * FROM ${sourceTable};`;
}

function dropOriginal(tableName) {
  return `DROP TABLE "${tableName}"`;
}

function dropTempTable(alteredName) {
  return `DROP TABLE "${alteredName}"`;
}

function renameTable(tableName, alteredName) {
  return `ALTER TABLE "${tableName}" RENAME TO "${alteredName}"`;
}

function getTableSql(tableName) {
  return `SELECT name, sql FROM sqlite_master WHERE type="table" AND name="${tableName}"`;
}

module.exports = {
  copyAllData,
  copyData,
  createTempTable,
  dropOriginal,
  dropTempTable,
  reinsertData,
  renameTable,
  getTableSql,
};
