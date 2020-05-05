const { getTableName } = require('./table-resolver');
const { ensureTable } = require('./table-creator');

// Lists all available migration versions, as a sorted array.
function listAll(migrationSource, loadExtensions) {
  return migrationSource.getMigrations(loadExtensions);
}

// Lists all migrations that have been completed for the current db, as an
// array.
async function listCompleted(tableName, schemaName, trxOrKnex) {
  await ensureTable(tableName, schemaName, trxOrKnex);
  const completedMigrations = await trxOrKnex
    .from(getTableName(tableName, schemaName))
    .orderBy('id')
    .select('name');

  return completedMigrations.map((migration) => {
    return migration.name;
  });
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
function listAllAndCompleted(config, trxOrKnex) {
  return Promise.all([
    listAll(config.migrationSource, config.loadExtensions),
    listCompleted(config.tableName, config.schemaName, trxOrKnex),
  ]);
}

module.exports = {
  listAll,
  listAllAndCompleted,
  listCompleted,
};
