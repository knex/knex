const { getTableName } = require('./table-resolver');
const { knexTablesExist } = require('./table-creator');

// Lists all available migration versions, as a sorted array.
function listAll(migrationSource, loadExtensions) {
  return migrationSource.getMigrations(loadExtensions);
}

// Lists all migrations that have been completed for the current db, as an
// array.
async function listCompleted(tableName, schemaName, trxOrKnex) {
  // If the internal tables (migrations and locks) don't exist, then
  // we haven't run any migrations at all.
  return (await knexTablesExist(tableName, schemaName, trxOrKnex))
    ? trxOrKnex
        .from(getTableName(tableName, schemaName))
        .orderBy('id')
        .select('name')
    : [];
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
