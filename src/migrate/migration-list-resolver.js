import Promise from 'bluebird';
import { filter, map, flatten, sortBy } from 'lodash';
import fs from 'fs';
import path from 'path';
import { getTableName } from './table-resolver';
import { ensureTable } from './table-creator';

const readDirAsync = Promise.promisify(fs.readdir, { context: fs });

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
  loadExtensions = DEFAULT_LOAD_EXTENSIONS,
  sortDirsSeparately = false
) {
  if (!Array.isArray(absoluteConfigDir)) {
    absoluteConfigDir = [absoluteConfigDir];
  }

  // Get a list of files in all specified migration directories
  const readMigrationsPromises = absoluteConfigDir.map((configDir) => {
    return readDirAsync(configDir);
  });

  return Promise.all(readMigrationsPromises).then((allMigrations) => {
    // Filter out files with irrelevant extensions
    let filteredMigrations = allMigrations.map((migrations) => {
      return filterMigrations(migrations, loadExtensions);
    });
    if (sortDirsSeparately) {
      filteredMigrations = filteredMigrations.map((migrations) => {
        return migrations.sort();
      });
    }
    filteredMigrations = filteredMigrations.map((migrations, index) => {
      const absoluteDir = absoluteConfigDir[index];
      return migrations.map((migration) => {
        return {
          directory: absoluteDir,
          file: migration,
        };
      });
    });

    let combinedMigrations = flatten(filteredMigrations);
    if (!sortDirsSeparately) {
      combinedMigrations = sortBy(combinedMigrations, 'file');
    }

    return combinedMigrations;
  });
}

function filterMigrations(migrations, loadExtensions) {
  return filter(migrations, (value) => {
    const extension = path.extname(value);
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
    .then((migrations) => map(migrations, 'name'));
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
export function listAllAndCompleted(config, trxOrKnex, absoluteConfigDir) {
  return Promise.all([
    listAll(
      absoluteConfigDir,
      config.loadExtensions,
      config.sortDirsSeparately
    ),
    listCompleted(config.tableName, config.schemaName, trxOrKnex),
  ]);
}
