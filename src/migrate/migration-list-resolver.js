import Promise from "bluebird";
import {filter, includes, map} from "lodash";
import * as fs from "fs";
import path from 'path';
import {getTableName} from './table-resolver'

// Lists all available migration versions, as a sorted array.
export function listAll(loadExtensions) {
  return Promise.promisify(fs.readdir, {context: fs})(this._absoluteConfigDir())
    .then(migrations => {
      return filter(migrations, function (value) {
        const extension = path.extname(value);
        return includes(loadExtensions, extension);
      }).sort();
    })
}

// Lists all migrations that have been completed for the current db, as an
// array.
export function listCompleted(tableName, schemaName, trxOrKnex) {
  return this._ensureTable(trxOrKnex)
    .then(() => trxOrKnex.from(getTableName(tableName, schemaName)).orderBy('id').select('name'))
    .then((migrations) => map(migrations, 'name'))
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
export function listAllAndCompleted(config, trxOrKnex) {
  return Promise.all([
    listAll(config.loadExtensions),
    listCompleted(config.tableName, config.schemaName, trxOrKnex)
  ]);
}

