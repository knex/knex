'use strict';

exports.__esModule = true;
exports.ensureTable = ensureTable;
exports.getSchemaBuilder = getSchemaBuilder;

var _tableResolver = require('./table-resolver');

function ensureTable(tableName, schemaName, trxOrKnex) {
  var lockTable = (0, _tableResolver.getLockTableName)(tableName);
  var lockTableWithSchema = (0, _tableResolver.getLockTableNameWithSchema)(
    tableName,
    schemaName
  );
  return getSchemaBuilder(trxOrKnex, schemaName)
    .hasTable(tableName)
    .then(function(exists) {
      return !exists && _createMigrationTable(tableName, schemaName, trxOrKnex);
    })
    .then(function() {
      return getSchemaBuilder(trxOrKnex, schemaName).hasTable(lockTable);
    })
    .then(function(exists) {
      return (
        !exists && _createMigrationLockTable(lockTable, schemaName, trxOrKnex)
      );
    })
    .then(function() {
      return (0, _tableResolver.getTable)(
        trxOrKnex,
        lockTable,
        schemaName
      ).select('*');
    })
    .then(function(data) {
      return (
        !data.length &&
        trxOrKnex.into(lockTableWithSchema).insert({ is_locked: 0 })
      );
    });
}

function _createMigrationTable(tableName, schemaName, trxOrKnex) {
  return getSchemaBuilder(trxOrKnex, schemaName).createTable(
    (0, _tableResolver.getTableName)(tableName),
    function(t) {
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
    function(t) {
      t.increments('index').primary();
      t.integer('is_locked');
    }
  );
}

//Get schema-aware schema builder for a given schema nam
function getSchemaBuilder(trxOrKnex, schemaName) {
  return schemaName
    ? trxOrKnex.schema.withSchema(schemaName)
    : trxOrKnex.schema;
}
