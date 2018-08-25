import Promise from 'bluebird';
import { filter } from 'lodash';
import path from 'path';
import { getTableName } from './table-resolver';
import { ensureTable } from './table-creator';

export const DEFAULT_LOAD_EXTENSIONS = Object.freeze([
  '.co',
  '.coffee',
  '.eg',
  '.iced',
  '.js',
  '.litcoffee',
  '.ls',
  '.ts',
]);

// Lists all available migration versions, as a sorted array.
export function listAll(
  migrationSource,
  loadExtensions = DEFAULT_LOAD_EXTENSIONS
) {
  return migrationSource.getMigrations().then((migrations) => {
    return filterMigrations(migrationSource, migrations, loadExtensions);
  });
}

function filterMigrations(migrationSource, migrations, loadExtensions) {
  return filter(migrations, (migration) => {
    const migrationName = migrationSource.getMigrationName(migration);
    const extension = path.extname(migrationName);
    return loadExtensions.includes(extension);
  });
}

// Lists all migrations that have been completed for the current db, as an
// array.
export function listCompleted(tableName, schemaName, trxOrKnex) {
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
export function listAllAndCompleted(config, trxOrKnex) {
  return Promise.all([
    listAll(config.migrationSource, config.loadExtensions),
    listCompleted(config.tableName, config.schemaName, trxOrKnex),
  ]);
}
