import Promise from 'bluebird';
import { filter, map } from 'lodash';
import fs from 'fs';
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
  absoluteConfigDir,
  loadExtensions = DEFAULT_LOAD_EXTENSIONS
) {
  return Promise.promisify(fs.readdir, { context: fs })(absoluteConfigDir).then(
    (migrations) => {
      return filter(migrations, function(value) {
        const extension = path.extname(value);
        return loadExtensions.includes(extension);
      }).sort();
    }
  );
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
    .then((migrations) => map(migrations, 'name'));
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
export function listAllAndCompleted(config, trxOrKnex, absoluteConfigDir) {
  return Promise.all([
    listAll(absoluteConfigDir, config.loadExtensions),
    listCompleted(config.tableName, config.schemaName, trxOrKnex),
  ]);
}
