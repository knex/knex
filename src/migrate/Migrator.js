// Migrator
// -------
import Promise from 'bluebird';
import {
  assign,
  differenceWith,
  each,
  filter,
  get,
  isFunction,
  isBoolean,
  isEmpty,
  isUndefined,
  max,
} from 'lodash';
import inherits from 'inherits';
import {
  getLockTableName,
  getLockTableNameWithSchema,
  getTable,
  getTableName,
} from './table-resolver';
import { getSchemaBuilder } from './table-creator';
import * as migrationListResolver from './migration-list-resolver';
import FsMigrations, { DEFAULT_LOAD_EXTENSIONS } from './sources/fs-migrations';
import MigrationGenerator from './MigrationGenerator';

function LockError(msg) {
  this.name = 'MigrationLocked';
  this.message = msg;
}

inherits(LockError, Error);

const CONFIG_DEFAULT = Object.freeze({
  extension: 'js',
  loadExtensions: DEFAULT_LOAD_EXTENSIONS,
  tableName: 'knex_migrations',
  schemaName: null,
  directory: './migrations',
  disableTransactions: false,
  sortDirsSeparately: false,
});

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.
export default class Migrator {
  constructor(knex) {
    // Clone knex instance and remove post-processing that is unnecessary for internal queries from a cloned config
    if (isFunction(knex)) {
      if (!knex.isTransaction) {
        this.knex = knex.withUserParams({
          ...knex.userParams,
        });
      } else {
        this.knex = knex;
      }
    } else {
      this.knex = Object.assign({}, knex);
      this.knex.userParams = this.knex.userParams || {};
    }

    this.config = getMergedConfig(this.knex.client.config.migrations);
    this.generator = new MigrationGenerator(this.knex.client.config.migrations);
    this._activeMigration = {
      fileName: null,
    };
  }

  // Migrators to the latest configuration.
  latest(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config);

    return migrationListResolver
      .listAllAndCompleted(this.config, this.knex)
      .tap((value) => validateMigrationList(this.config.migrationSource, value))
      .spread((all, completed) => {
        const migrations = getNewMigrations(
          this.config.migrationSource,
          all,
          completed
        );

        const transactionForAll =
          !this.config.disableTransactions &&
          isEmpty(
            filter(migrations, (migration) => {
              const migrationContents = this.config.migrationSource.getMigration(
                migration
              );
              return !this._useTransaction(migrationContents);
            })
          );

        if (transactionForAll) {
          return this.knex.transaction((trx) => {
            return this._runBatch(migrations, 'up', trx);
          });
        } else {
          return this._runBatch(migrations, 'up');
        }
      });
  }

  // Rollback the last "batch", or all, of migrations that were run.
  rollback(config, all = false) {
    this._disableProcessing();
    return Promise.try(() => {
      this.config = getMergedConfig(config, this.config);

      return migrationListResolver
        .listAllAndCompleted(this.config, this.knex)
        .tap((value) =>
          validateMigrationList(this.config.migrationSource, value)
        )
        .then((val) => (all ? val[0] : this._getLastBatch(val)))
        .then((migrations) => {
          return this._runBatch(migrations, 'down');
        });
    });
  }

  status(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config);

    return Promise.all([
      getTable(this.knex, this.config.tableName, this.config.schemaName).select(
        '*'
      ),
      migrationListResolver.listAll(this.config.migrationSource),
    ]).spread((db, code) => db.length - code.length);
  }

  // Retrieves and returns the current migration version we're on, as a promise.
  // If no migrations have been run yet, return "none".
  currentVersion(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config);

    return migrationListResolver
      .listCompleted(this.config.tableName, this.config.schemaName, this.knex)
      .then((completed) => {
        const val = max(completed.map((value) => value.split('_')[0]));
        return isUndefined(val) ? 'none' : val;
      });
  }

  forceFreeMigrationsLock(config) {
    this.config = getMergedConfig(config, this.config);

    const lockTable = getLockTableName(this.config.tableName);
    return getSchemaBuilder(this.knex, this.config.schemaName)
      .hasTable(lockTable)
      .then((exist) => exist && this._freeLock());
  }

  // Creates a new migration, with a given name.
  make(name, config) {
    this.config = getMergedConfig(config, this.config);
    return this.generator.make(name, this.config);
  }

  _disableProcessing() {
    if (this.knex.disableProcessing) {
      this.knex.disableProcessing();
    }
  }

  _isLocked(trx) {
    const tableName = getLockTableName(this.config.tableName);
    return getTable(this.knex, tableName, this.config.schemaName)
      .transacting(trx)
      .forUpdate()
      .select('*')
      .then((data) => data[0].is_locked);
  }

  _lockMigrations(trx) {
    const tableName = getLockTableName(this.config.tableName);
    return getTable(this.knex, tableName, this.config.schemaName)
      .transacting(trx)
      .update({ is_locked: 1 });
  }

  _getLock(trx) {
    const transact = trx ? (fn) => fn(trx) : (fn) => this.knex.transaction(fn);
    return transact((trx) => {
      return this._isLocked(trx)
        .then((isLocked) => {
          if (isLocked) {
            throw new Error('Migration table is already locked');
          }
        })
        .then(() => this._lockMigrations(trx));
    }).catch((err) => {
      throw new LockError(err.message);
    });
  }

  _freeLock(trx = this.knex) {
    const tableName = getLockTableName(this.config.tableName);
    return getTable(trx, tableName, this.config.schemaName).update({
      is_locked: 0,
    });
  }

  // Run a batch of current migrations, in sequence.
  _runBatch(migrations, direction, trx) {
    return (
      this._getLock(trx)
        // When there is a wrapping transaction, some migrations
        // could have been done while waiting for the lock:
        .then(() =>
          trx
            ? migrationListResolver.listCompleted(
                this.config.tableName,
                this.config.schemaName,
                trx
              )
            : []
        )
        .then(
          (completed) =>
            (migrations = getNewMigrations(
              this.config.migrationSource,
              migrations,
              completed
            ))
        )
        .then(() =>
          Promise.all(
            migrations.map(this._validateMigrationStructure.bind(this))
          )
        )
        .then(() => this._latestBatchNumber(trx))
        .then((batchNo) => {
          if (direction === 'up') batchNo++;
          return batchNo;
        })
        .then((batchNo) => {
          return this._waterfallBatch(batchNo, migrations, direction, trx);
        })
        .tap(() => this._freeLock(trx))
        .catch((error) => {
          let cleanupReady = Promise.resolve();

          if (error instanceof LockError) {
            // If locking error do not free the lock.
            this.knex.client.logger.warn(
              `Can't take lock to run migrations: ${error.message}`
            );
            this.knex.client.logger.warn(
              'If you are sure migrations are not running you can release the ' +
                'lock manually by deleting all the rows from migrations lock ' +
                'table: ' +
                getLockTableNameWithSchema(
                  this.config.tableName,
                  this.config.schemaName
                )
            );
          } else {
            if (this._activeMigration.fileName) {
              this.knex.client.logger.warn(
                `migration file "${this._activeMigration.fileName}" failed`
              );
            }
            this.knex.client.logger.warn(
              `migration failed with error: ${error.message}`
            );
            // If the error was not due to a locking issue, then remove the lock.
            cleanupReady = this._freeLock(trx);
          }

          return cleanupReady.finally(function() {
            throw error;
          });
        })
    );
  }

  // Validates some migrations by requiring and checking for an `up` and `down`
  // function.
  _validateMigrationStructure(migration) {
    const migrationName = this.config.migrationSource.getMigrationName(
      migration
    );
    const migrationContent = this.config.migrationSource.getMigration(
      migration
    );
    if (
      typeof migrationContent.up !== 'function' ||
      typeof migrationContent.down !== 'function'
    ) {
      throw new Error(
        `Invalid migration: ${migrationName} must have both an up and down function`
      );
    }

    return migration;
  }

  // Get the last batch of migrations, by name, ordered by insert id in reverse
  // order.
  _getLastBatch([allMigrations]) {
    const { tableName, schemaName } = this.config;
    return getTable(this.knex, tableName, schemaName)
      .where('batch', function(qb) {
        qb.max('batch').from(getTableName(tableName, schemaName));
      })
      .orderBy('id', 'desc')
      .map((migration) => {
        return allMigrations.find((entry) => {
          return (
            this.config.migrationSource.getMigrationName(entry) ===
            migration.name
          );
        });
      });
  }

  // Returns the latest batch number.
  _latestBatchNumber(trx = this.knex) {
    return trx
      .from(getTableName(this.config.tableName, this.config.schemaName))
      .max('batch as max_batch')
      .then((obj) => obj[0].max_batch || 0);
  }

  // If transaction config for a single migration is defined, use that.
  // Otherwise, rely on the common config. This allows enabling/disabling
  // transaction for a single migration at will, regardless of the common
  // config.
  _useTransaction(migrationContent, allTransactionsDisabled) {
    const singleTransactionValue = get(migrationContent, 'config.transaction');

    return isBoolean(singleTransactionValue)
      ? singleTransactionValue
      : !allTransactionsDisabled;
  }

  // Runs a batch of `migrations` in a specified `direction`, saving the
  // appropriate database information as the migrations are run.
  _waterfallBatch(batchNo, migrations, direction, trx) {
    const trxOrKnex = trx || this.knex;
    const { tableName, schemaName, disableTransactions } = this.config;
    let current = Promise.bind({ failed: false, failedOn: 0 });
    const log = [];
    each(migrations, (migration) => {
      const name = this.config.migrationSource.getMigrationName(migration);
      this._activeMigration.fileName = name;
      const migrationContent = this.config.migrationSource.getMigration(
        migration
      );

      // We're going to run each of the migrations in the current "up".
      current = current
        .then(() => {
          this._activeMigration.fileName = name;
          if (
            !trx &&
            this._useTransaction(migrationContent, disableTransactions)
          ) {
            this.knex.enableProcessing();
            return this._transaction(
              this.knex,
              migrationContent,
              direction,
              name
            );
          }

          trxOrKnex.enableProcessing();
          return checkPromise(
            this.knex.client.logger,
            migrationContent[direction](trxOrKnex, Promise),
            name
          );
        })
        .then(() => {
          trxOrKnex.disableProcessing();
          this.knex.disableProcessing();
          log.push(name);
          if (direction === 'up') {
            return trxOrKnex.into(getTableName(tableName, schemaName)).insert({
              name,
              batch: batchNo,
              migration_time: new Date(),
            });
          }
          if (direction === 'down') {
            return trxOrKnex
              .from(getTableName(tableName, schemaName))
              .where({ name })
              .del();
          }
        });
    });

    return current.thenReturn([batchNo, log]);
  }

  _transaction(knex, migrationContent, direction, name) {
    return knex.transaction((trx) => {
      return checkPromise(
        knex.client.logger,
        migrationContent[direction](trx, Promise),
        name,
        () => {
          trx.commit();
        }
      );
    });
  }
}

export function getMergedConfig(config, currentConfig) {
  // config is the user specified config, mergedConfig has defaults and current config
  // applied to it.
  const mergedConfig = assign({}, CONFIG_DEFAULT, currentConfig || {}, config);

  if (
    config &&
    // If user specifies any FS related config,
    // clear existing FsMigrations migrationSource
    (config.directory ||
      config.sortDirsSeparately !== undefined ||
      config.loadExtensions)
  ) {
    mergedConfig.migrationSource = null;
  }

  // If the user has not specified any configs, we need to
  // default to fs migrations to maintain compatibility
  if (!mergedConfig.migrationSource) {
    mergedConfig.migrationSource = new FsMigrations(
      mergedConfig.directory,
      mergedConfig.sortDirsSeparately,
      mergedConfig.loadExtensions
    );
  }

  return mergedConfig;
}

// Validates that migrations are present in the appropriate directories.
function validateMigrationList(migrationSource, migrations) {
  const all = migrations[0];
  const completed = migrations[1];
  const diff = getMissingMigrations(migrationSource, completed, all);
  if (!isEmpty(diff)) {
    throw new Error(
      `The migration directory is corrupt, the following files are missing: ${diff.join(
        ', '
      )}`
    );
  }
}

function getMissingMigrations(migrationSource, completed, all) {
  return differenceWith(completed, all, (completedMigration, allMigration) => {
    return (
      completedMigration === migrationSource.getMigrationName(allMigration)
    );
  });
}

function getNewMigrations(migrationSource, all, completed) {
  return differenceWith(all, completed, (allMigration, completedMigration) => {
    return (
      completedMigration === migrationSource.getMigrationName(allMigration)
    );
  });
}

function checkPromise(logger, migrationPromise, name, commitFn) {
  if (!migrationPromise || typeof migrationPromise.then !== 'function') {
    logger.warn(`migration ${name} did not return a promise`);
    if (commitFn) {
      commitFn();
    }
  }
  return migrationPromise;
}
