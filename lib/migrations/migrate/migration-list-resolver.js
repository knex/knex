const { getTableName } = require('./table-resolver');
const { ensureTable } = require('./table-creator');

// Lists all available migration versions, as a sorted array.
function listAll(migrationSource, loadExtensions) {
  return migrationSource.getMigrations(loadExtensions);
}

// Lists all migrations that have been completed for the current db, as an
// array.
async function listCompleted(tableName, schemaName, trxOrKnex, clientSchema) {
  await ensureTable(tableName, clientSchema || schemaName, trxOrKnex);
  //TODO: if transactions are enabled for migrations, below params should be sent to getTableName
  // console.log('ensured in listCompleted', tableName, clientSchema, schemaName, getTableName(tableName, clientSchema && !trxOrKnex.isTransaction ? undefined : clientSchema||schemaName))
  return await trxOrKnex
    .from(getTableName(tableName, clientSchema ? undefined : schemaName))
    .orderBy('id')
    .select('name');
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
function listAllAndCompleted(config, trxOrKnex) {
  return Promise.all([
    listAll(config.migrationSource, config.loadExtensions),
    listCompleted(
      config.tableName,
      config.schemaName,
      trxOrKnex,
      config.clientSchema
    ),
  ]);
}

module.exports = {
  listAll,
  listAllAndCompleted,
  listCompleted,
};
