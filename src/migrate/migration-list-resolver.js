const Bluebird = require('bluebird');
const { getTableName } = require('./table-resolver');
const { ensureTable } = require('./table-creator');

// Lists all available migration versions, as a sorted array.
function listAll(migrationSource, loadExtensions) {
  return migrationSource.getMigrations(loadExtensions);
}

// Lists all migrations that have been completed for the current db, as an
// array.
function listCompleted(tableName, schemaName, trxOrKnex) {
  return ensureTable(tableName, schemaName, trxOrKnex)
    .then(() =>
      trxOrKnex
        .from(getTableName(tableName, schemaName))
        .orderBy('id')
        .select('name')
    )
    .then((migrations) =>
      migrations.map((migration) => {
        return migration.name;
      })
    );
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
function listAllAndCompleted(config, trxOrKnex) {
  return Bluebird.all([
    listAll(config.migrationSource, config.loadExtensions),
    listCompleted(config.tableName, config.schemaName, trxOrKnex),
  ]);
}

module.exports = {
  listAll,
  listAllAndCompleted,
  listCompleted,
};
