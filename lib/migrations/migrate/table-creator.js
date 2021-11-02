const {
  getTable,
  getLockTableName,
  getLockTableNameWithSchema,
  getTableName,
} = require('./table-resolver');

function ensureTable(tableName, schemaName, trxOrKnex) {
  const lockTable = getLockTableName(tableName);
  return getSchemaBuilder(trxOrKnex, schemaName)
    .hasTable(tableName)
    .then((exists) => {
      return !exists && _createMigrationTable(tableName, schemaName, trxOrKnex);
    })
    .then(() => {
      return getSchemaBuilder(trxOrKnex, schemaName).hasTable(lockTable);
    })
    .then((exists) => {
      return (
        !exists && _createMigrationLockTable(lockTable, schemaName, trxOrKnex)
      );
    })
    .then(() => {
      return getTable(trxOrKnex, lockTable, schemaName).select('*');
    })
    .then((data) => {
      return (
        !data.length && _insertLockRowIfNeeded(tableName, schemaName, trxOrKnex)
      );
    });
}

function _createMigrationTable(tableName, schemaName, trxOrKnex) {
  return getSchemaBuilder(trxOrKnex, schemaName).createTable(
    getTableName(tableName),
    function (t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    }
  );
}

function _createMigrationLockTable(tableName, schemaName, trxOrKnex) {
  return getSchemaBuilder(trxOrKnex, schemaName).createTable(
    tableName,
    function (t) {
      t.increments('index').primary();
      t.integer('is_locked');
    }
  );
}

function _insertLockRowIfNeeded(tableName, schemaName, trxOrKnex) {
  const lockTableWithSchema = getLockTableNameWithSchema(tableName, schemaName);
  return trxOrKnex
    .from(trxOrKnex.raw('?? (??)', [lockTableWithSchema, 'is_locked']))
    .insert(function () {
      return this.select(trxOrKnex.raw('?', [0])).whereNotExists(function () {
        return this.select('*').from(lockTableWithSchema);
      });
    });
}

//Get schema-aware schema builder for a given schema nam
function getSchemaBuilder(trxOrKnex, schemaName) {
  return schemaName
    ? trxOrKnex.schema.withSchema(schemaName)
    : trxOrKnex.schema;
}

module.exports = {
  ensureTable,
  getSchemaBuilder,
};
