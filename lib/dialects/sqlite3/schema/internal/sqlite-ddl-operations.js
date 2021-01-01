const identity = require('lodash/identity');
const chunk = require('lodash/chunk');

async function insertChunked(trx, chunkSize, target, iterator, result) {
  iterator = iterator || identity;
  const chunked = chunk(result, chunkSize);
  for (const batch of chunked) {
    await trx.queryBuilder().table(target).insert(batch.map(iterator));
  }
}

function createTempTable(createTable, tablename, alteredName) {
  return createTable.sql.replace(tablename, alteredName);
}

async function copyData(trx, tableName, alteredName) {
  const originalData = await trx.raw(`SELECT * FROM "${tableName}"`);
  return insertChunked(trx, 20, alteredName, identity, originalData);
}

function dropOriginal(tableName) {
  return `DROP TABLE "${tableName}"`;
}

function dropTempTable(alteredName) {
  return `DROP TABLE "${alteredName}"`;
}

async function reinsertData(trx, iterator, tableName, alteredName) {
  const existingData = await trx.raw(`SELECT * FROM "${alteredName}"`);
  return insertChunked(trx, 20, tableName, iterator, existingData);
}

function renameTable(tableName, alteredName) {
  return `ALTER TABLE "${tableName}" RENAME TO "${alteredName}"`;
}

function getTableSql(tableName) {
  return `SELECT name, sql FROM sqlite_master WHERE type="table" AND name="${tableName}"`;
}

module.exports = {
  copyData,
  createTempTable,
  dropOriginal,
  dropTempTable,
  reinsertData,
  renameTable,
  getTableSql,
};
