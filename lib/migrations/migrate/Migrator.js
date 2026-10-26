// Migrator
// -------
const os = require('os');
const differenceWith = require('lodash/differenceWith');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const max = require('lodash/max');
const {
  getLockTableName,
  getTable,
  getTableName,
} = require('./table-resolver');
const { getSchemaBuilder, upgradeLockTable } = require('./table-creator');
const migrationListResolver = require('./migration-list-resolver');
const MigrationGenerator = require('./MigrationGenerator');
const { getMergedConfig } = require('./migrator-configuration-merger');
const { isBoolean, isFunction } = require('../../util/is');
const { nanoid } = require('../../util/nanoid');

class LockError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'MigrationLocked';
  }
}

class LockLostError extends LockError {}

// The migrations chosen once the lock was held no longer fit the transaction
// the lock was taken in, so the batch starts over with them.
class StartOver extends Error {
  constructor(migrations) {
    super('The migrations to run changed before the lock was taken');
    this.migrations = migrations;
  }
}

const freeLockRow = {
  is_locked: 0,
  lock_id: null,
  locked_by: null,
  lock_expires_at: null,
};

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.
class Migrator {
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

    this.config = getMergedConfig(
      this.knex.client.config.migrations,
      undefined,
      this.knex.client.logger
    );
    this.generator = new MigrationGenerator(
      this.knex.client.config.migrations,
      this.knex.client.logger
    );
    this._activeMigration = {
      fileName: null,
    };
    this._lockId = null;
  }

  // Migrators to the latest configuration.
  async latest(config) {
    this._disableProcessing();
    this._mergeRunConfig(config);

    const allAndCompleted = await migrationListResolver.listAllAndCompleted(
      this.config,
      this.knex
    );

    if (!this.config.disableMigrationsListValidation) {
      validateMigrationList(this.config.migrationSource, allAndCompleted);
    }

    return this._runChosen('up', allAndCompleted, (all, completed) =>
      getNewMigrations(this.config.migrationSource, all, completed)
    );
  }

  // Runs the next migration that has not yet been run
  async up(config) {
    this._disableProcessing();
    this._mergeRunConfig(config);

    const allAndCompleted = await migrationListResolver.listAllAndCompleted(
      this.config,
      this.knex
    );

    if (!this.config.disableMigrationsListValidation) {
      validateMigrationList(this.config.migrationSource, allAndCompleted);
    }

    return await this._runChosen('up', allAndCompleted, (all, completed) => {
      const newMigrations = getNewMigrations(
        this.config.migrationSource,
        all,
        completed
      );

      let migrationToRun;
      const name = this.config.name;
      if (name) {
        if (!completed.map((m) => m.name).includes(name)) {
          migrationToRun = newMigrations.find((migration) => {
            return (
              this.config.migrationSource.getMigrationName(migration) === name
            );
          });
          if (!migrationToRun) {
            throw new Error(`Migration "${name}" not found.`);
          }
        }
      } else {
        migrationToRun = newMigrations[0];
      }

      const migrationsToRun = [];
      if (migrationToRun) {
        migrationsToRun.push(migrationToRun);
      }
      return migrationsToRun;
    });
  }

  // Rollback the last "batch", or all, of migrations that were run.
  rollback(config, all = false) {
    this._disableProcessing();
    return new Promise((resolve, reject) => {
      try {
        this._mergeRunConfig(config);
      } catch (e) {
        return reject(e);
      }
      migrationListResolver
        .listAllAndCompleted(this.config, this.knex)
        .then((value) => {
          if (!this.config.disableMigrationsListValidation) {
            validateMigrationList(this.config.migrationSource, value);
          }
          return value;
        })
        .then((val) => {
          return this._runChosen(
            'down',
            val,
            (allMigrations, completedMigrations) => {
              return all
                ? allMigrations
                    .filter((migration) => {
                      return completedMigrations
                        .map((migration) => migration.name)
                        .includes(
                          this.config.migrationSource.getMigrationName(
                            migration
                          )
                        );
                    })
                    .reverse()
                : this._getLastBatch([allMigrations]);
            }
          );
        })
        .then(resolve, reject);
    });
  }

  async down(config) {
    this._disableProcessing();
    this._mergeRunConfig(config);

    return migrationListResolver
      .listAllAndCompleted(this.config, this.knex)
      .then((value) => {
        if (!this.config.disableMigrationsListValidation) {
          validateMigrationList(this.config.migrationSource, value);
        }
        return value;
      })
      .then((value) => {
        return this._runChosen('down', value, (all, completed) => {
          const completedMigrations = all.filter((migration) => {
            return completed
              .map((migration) => migration.name)
              .includes(
                this.config.migrationSource.getMigrationName(migration)
              );
          });

          let migrationToRun;
          const name = this.config.name;
          if (name) {
            migrationToRun = completedMigrations.find((migration) => {
              return (
                this.config.migrationSource.getMigrationName(migration) === name
              );
            });
            if (!migrationToRun) {
              throw new Error(`Migration "${name}" was not run.`);
            }
          } else {
            migrationToRun =
              completedMigrations[completedMigrations.length - 1];
          }

          const migrationsToRun = [];
          if (migrationToRun) {
            migrationsToRun.push(migrationToRun);
          }
          return migrationsToRun;
        });
      });
  }

  // Migrate up to a specific migration (inclusive).
  // Runs all pending migrations up to and including the specified one.
  async to(config) {
    this._disableProcessing();
    this._mergeRunConfig(config);

    const name = this.config.name;
    if (!name) {
      throw new Error(
        'A migration name must be specified when using migrate.to()'
      );
    }

    const allAndCompleted = await migrationListResolver.listAllAndCompleted(
      this.config,
      this.knex
    );

    if (!this.config.disableMigrationsListValidation) {
      validateMigrationList(this.config.migrationSource, allAndCompleted);
    }

    const [all] = allAndCompleted;

    const targetIndex = all.findIndex(
      (migration) =>
        this.config.migrationSource.getMigrationName(migration) === name
    );

    if (targetIndex === -1) {
      throw new Error(`Migration "${name}" not found.`);
    }

    return this._runChosen('up', allAndCompleted, (all, completed) => {
      const completedNames = completed.map((m) => m.name);

      return all.slice(0, targetIndex + 1).filter((migration) => {
        return !completedNames.includes(
          this.config.migrationSource.getMigrationName(migration)
        );
      });
    });
  }

  // Migrate up to just before a specific migration (exclusive).
  // Runs all pending migrations before the specified one.
  async before(config) {
    this._disableProcessing();
    this._mergeRunConfig(config);

    const name = this.config.name;
    if (!name) {
      throw new Error(
        'A migration name must be specified when using migrate.before()'
      );
    }

    const allAndCompleted = await migrationListResolver.listAllAndCompleted(
      this.config,
      this.knex
    );

    if (!this.config.disableMigrationsListValidation) {
      validateMigrationList(this.config.migrationSource, allAndCompleted);
    }

    const [all] = allAndCompleted;

    const targetIndex = all.findIndex(
      (migration) =>
        this.config.migrationSource.getMigrationName(migration) === name
    );

    if (targetIndex === -1) {
      throw new Error(`Migration "${name}" not found.`);
    }

    if (targetIndex === 0) {
      return [0, []];
    }

    return this._runChosen('up', allAndCompleted, (all, completed) => {
      const completedNames = completed.map((m) => m.name);

      return all.slice(0, targetIndex).filter((migration) => {
        return !completedNames.includes(
          this.config.migrationSource.getMigrationName(migration)
        );
      });
    });
  }

  status(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config, this.knex.client.logger);

    return Promise.all([
      getTable(this.knex, this.config.tableName, this.config.schemaName).select(
        '*'
      ),
      migrationListResolver.listAll(this.config.migrationSource),
    ]).then(([db, code]) => db.length - code.length);
  }

  // Retrieves and returns the current migration version we're on, as a promise.
  // If no migrations have been run yet, return "none".
  currentVersion(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config, this.knex.client.logger);

    return migrationListResolver
      .listCompleted(this.config.tableName, this.config.schemaName, this.knex)
      .then((completed) => {
        const val = max(completed.map((value) => value.name.split('_')[0]));
        return val === undefined ? 'none' : val;
      });
  }

  // list all migrations
  async list(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config, this.knex.client.logger);

    const [all, completed] = await migrationListResolver.listAllAndCompleted(
      this.config,
      this.knex
    );

    if (!this.config.disableMigrationsListValidation) {
      validateMigrationList(this.config.migrationSource, [all, completed]);
    }

    const newMigrations = getNewMigrations(
      this.config.migrationSource,
      all,
      completed
    );
    return [completed, newMigrations];
  }

  async forceFreeMigrationsLock(config) {
    this._disableProcessing();
    this.config = getMergedConfig(config, this.config, this.knex.client.logger);
    const { schemaName, tableName } = this.config;
    const lockTableName = getLockTableName(tableName);
    const { knex } = this;
    const getLockTable = () => getTable(knex, lockTableName, schemaName);
    const tableExists = await getSchemaBuilder(knex, schemaName).hasTable(
      lockTableName
    );
    if (tableExists) {
      // An unlock is a first use too: a lock table from an earlier version
      // gets the holder columns before it is reset.
      await upgradeLockTable(lockTableName, schemaName, knex);
      await getLockTable().del();
      await getLockTable().insert({
        is_locked: 0,
      });
    }
  }

  // Creates a new migration, with a given name.
  make(name, config) {
    return this.generator.make(name, config, this.knex.client.logger);
  }

  _disableProcessing() {
    if (this.knex.disableProcessing) {
      this.knex.disableProcessing();
    }
  }

  // Commands that run migrations refuse an invalid lockTimeout before they
  // read or create anything.
  _mergeRunConfig(config) {
    this.config = getMergedConfig(config, this.config, this.knex.client.logger);
    getLockTimeout(this.config);
  }

  _lockTable(trx) {
    const tableName = getLockTableName(this.config.tableName);
    const table = getTable(this.knex, tableName, this.config.schemaName);
    return trx ? table.transacting(trx) : table;
  }

  async _lockMigrations(trx) {
    const lockTimeout = getLockTimeout(this.config);
    const lockId = nanoid();
    const claim = {
      is_locked: 1,
      lock_id: lockId,
      locked_by: `${os.hostname()}:${process.pid}`,
      lock_expires_at: expiresAt(Date.now(), lockTimeout),
    };

    if (!(await this._claimFreeLock(trx, claim))) {
      await this._takeOverExpiredLock(trx, claim);
    }
    // Taking the row may have waited for another transaction to let go of it,
    // so the time this run keeps the lock starts once the row is its own.
    this._lockId = lockId;
    await this._writeDeadline(trx, false);
  }

  async _takeOverExpiredLock(trx, claim) {
    const current = await this._currentHolder(trx);
    const now = Date.now();
    if (!current || current.expiresAt >= now) {
      throw lockedBy(current);
    }

    // A holder that renewed its lock since it was read keeps it.
    const taken = await this._lockTable(trx)
      .where({ is_locked: 1, lock_id: current.lockId })
      .where('lock_expires_at', '<', now)
      .update(claim);
    if (taken !== 1) {
      throw lockedBy(await this._currentHolder(trx));
    }
    this.knex.client.logger.warn(
      `Took over the migration lock held by ${
        current.holder
      }, which expired at ${new Date(current.expiresAt).toISOString()}`
    );
  }

  // Starters that raced to create the lock table may each have added a row,
  // so a claim takes every free row at once and holds the lock only when no
  // row escaped it; otherwise it gives the rows back. Of the rows it took, one
  // is kept.
  async _claimFreeLock(trx, claim) {
    const claimed = await this._lockTable(trx)
      .where('is_locked', '=', 0)
      .update(claim);
    if (!claimed) {
      return false;
    }
    const rows = await this._lockTable(trx)
      .select('index', 'lock_id')
      .orderBy('index');
    if (rows.some((row) => row.lock_id !== claim.lock_id)) {
      await this._lockTable(trx)
        .where('lock_id', '=', claim.lock_id)
        .update(freeLockRow);
      return false;
    }
    if (rows.length > 1) {
      await this._lockTable(trx).whereNot('index', rows[0].index).del();
    }
    return true;
  }

  // The recorded holder of a held lock, or undefined when the table does not
  // record one (a lock taken by an earlier version, set by hand, or several
  // held rows).
  async _currentHolder(trx) {
    const held = (await this._lockTable(trx).select('*')).filter((row) =>
      Number(row.is_locked)
    );
    const [row] = held;
    if (held.length !== 1 || !row.lock_id || row.lock_expires_at === null) {
      return undefined;
    }
    return {
      lockId: row.lock_id,
      holder: row.locked_by,
      expiresAt: Number(row.lock_expires_at),
    };
  }

  _getLock(trx) {
    const transact = trx ? (fn) => fn(trx) : (fn) => this.knex.transaction(fn);
    return transact((trx) => {
      return this._lockMigrations(trx);
    }).catch((err) => {
      throw err instanceof LockError ? err : new LockError(err.message);
    });
  }

  // Between migrations, a run outside a batch transaction confirms that it
  // still holds the lock and extends it by lockTimeout. Nothing renews it in
  // the background, so nothing competes with a migration for its connection.
  // The time is read once a connection is held.
  _confirmLock(trx) {
    if (trx) {
      return this._writeDeadline(trx, true);
    }
    return this.knex.transaction((t) => this._writeDeadline(t, true));
  }

  // Right before a migration runs, a run outside a batch transaction confirms
  // the lock again, since loading the migration and its beforeEach hook may
  // have outlasted it. Like the run's other lock queries, this one goes through
  // without the caller's identifier and response processing.
  async _confirmBeforeRunning(trx) {
    this.knex.disableProcessing();
    try {
      await this._confirmLock(trx);
    } finally {
      this.knex.enableProcessing();
    }
  }

  // The lock lasts lockTimeout from now. An extension only applies to a lock
  // whose time has not passed: once it has, another run may already have read
  // it as expired, so the lock is lost.
  async _writeDeadline(trx, extension) {
    const lockTimeout = getLockTimeout(this.config);
    const now = Date.now();
    const held = this._lockTable(trx).where({
      is_locked: 1,
      lock_id: this._lockId,
    });
    if (extension) {
      held.where('lock_expires_at', '>=', now);
    }
    const written = await held.update({
      lock_expires_at: expiresAt(now, lockTimeout),
    });
    if (written !== 1) {
      throw await this._lockLostError(trx);
    }
  }

  // A lock whose time ran out while it still names this run is held by nobody.
  async _lockLostError(trx, lockId = this._lockId) {
    const current = await this._currentHolder(trx);
    return new LockLostError(
      current && current.lockId !== lockId
        ? `Migration lock was lost to ${current.holder}`
        : 'Migration lock was lost'
    );
  }

  // Releases this run's lock. When `live` is set, the lock must also not have
  // run out: a lock whose time passed is lost, not released.
  _freeLock(trx = this.knex, live = false) {
    const lockId = this._lockId;
    if (!lockId) {
      return Promise.resolve(0);
    }
    this._lockId = null;
    const tableName = getLockTableName(this.config.tableName);
    const held = getTable(trx, tableName, this.config.schemaName).where(
      'lock_id',
      '=',
      lockId
    );
    if (live) {
      held.where('lock_expires_at', '>=', Date.now());
    }
    return held.update(freeLockRow);
  }

  // Runs the migrations that `choose` picks from all migrations and the
  // completed ones. Whether the batch runs in one transaction follows from the
  // migrations chosen before the lock is taken; the batch starts over when
  // those chosen again once it is held need the other kind.
  async _runChosen(direction, [all, completed], choose) {
    let migrations = await choose(all, completed);
    for (;;) {
      try {
        if (await this._transactionForAll(migrations, direction)) {
          return await this.knex.transaction((trx) => {
            return this._runBatch(all, choose, direction, trx);
          });
        }
        return await this._runBatch(all, choose, direction);
      } catch (error) {
        if (!(error instanceof StartOver)) {
          throw error;
        }
        migrations = error.migrations;
      }
    }
  }

  // An upward batch runs in one transaction when all its migrations use one.
  async _transactionForAll(migrations, direction) {
    if (direction !== 'up' || this.config.disableTransactions) {
      return false;
    }
    const contents = await Promise.all(
      migrations.map((migration) =>
        this.config.migrationSource.getMigration(migration)
      )
    );
    return contents.every((content) => this._useTransaction(content));
  }

  // Run a batch of current migrations, in sequence.
  async _runBatch(all, choose, direction, trx) {
    try {
      // A batch that runs in one transaction takes and releases the lock inside
      // it, so the lock, the batch and its records commit or roll back together.
      // CockroachDB too: the batch writes each record before the next
      // migration's schema changes in that transaction anyway, and a lock
      // committed apart from the batch can be lost without the batch seeing it.
      await this._getLock(trx);
      // Another process may have migrated or rolled back while this one was
      // waiting for the lock, so the migrations to run are chosen again.
      const completed = await migrationListResolver.listCompleted(
        this.config.tableName,
        this.config.schemaName,
        trx || this.knex
      );
      if (!this.config.disableMigrationsListValidation) {
        validateMigrationList(this.config.migrationSource, [all, completed]);
      }
      const migrations = await choose(all, completed);
      if (
        migrations.length > 0 &&
        (await this._transactionForAll(migrations, direction)) !== Boolean(trx)
      ) {
        throw new StartOver(migrations);
      }

      await Promise.all(
        migrations.map(this._validateMigrationStructure.bind(this))
      );

      let batchNo = await this._latestBatchNumber(trx);

      // Run any hooks before/after this batch
      const beforeAll = this.config.beforeAll || (() => {});
      const afterAll = this.config.afterAll || (() => {});

      // Maintain the same return value shape as _waterfallBatch:
      // [batchNo, [...migrationFile]]
      //
      // The result here affects at minimum the CLI handling, which
      // will break if the return value does not conform to the
      // expected shape.
      //
      // currently, batchNo is not actually consumed when the "log" array
      // (second value of tuple) is empty; however, this default value
      // accurately reflects what it _would_ have returned if no migrations
      // were run.
      let res = [batchNo, []];
      if (migrations.length > 0) {
        // this._waterfallBatch() records successful up migrations by batch number,
        // or deletes the entry for successful down migrations. new entries should
        // be monotonically-increasing, so increment the batch number when migrating
        // up so that _waterfallBatch() records the correct value -- but don't
        // increment it when migrating down, so that _waterfallBatch() removes the
        // correct value.
        if (direction === 'up') batchNo++;

        await beforeAll(trx || this.knex, migrations);
        res = await this._waterfallBatch(batchNo, migrations, direction, trx);
        await afterAll(trx || this.knex, migrations);
        // The hook may have outlasted the lock; a lock that ran out is lost,
        // not released.
        if (!trx) {
          await this._confirmLock();
        }
      }

      // Outside a batch transaction the release also needs the lock to be live:
      // it may have run out in the work since it was last confirmed.
      const lockId = this._lockId;
      if ((await this._freeLock(trx, !trx)) !== 1) {
        throw await this._lockLostError(trx, lockId);
      }
      return res;
    } catch (error) {
      let cleanupReady = Promise.resolve();

      if (error instanceof StartOver) {
        cleanupReady = this._freeLock(trx);
      } else if (error instanceof LockLostError) {
        this.knex.client.logger.warn(
          `Stopped running migrations: ${error.message}`
        );
      } else if (error instanceof LockError) {
        // If locking error do not free the lock.
        this.knex.client.logger.warn(
          `Can't take lock to run migrations: ${error.message}`
        );
        this.knex.client.logger.warn(
          'If you are sure migrations are not running you can release the ' +
            "lock manually by running 'knex migrate:unlock'"
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

      try {
        await cleanupReady;
        // eslint-disable-next-line no-empty
      } catch (e) {}
      throw error;
    }
  }

  // Validates some migrations by requiring and checking for an `up` and `down`
  // function.
  async _validateMigrationStructure(migration) {
    const migrationName =
      this.config.migrationSource.getMigrationName(migration);
    // maybe promise
    const migrationContent = await this.config.migrationSource.getMigration(
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
  async _getLastBatch([allMigrations]) {
    const { tableName, schemaName } = this.config;
    const migrationNames = await getTable(this.knex, tableName, schemaName)
      .where('batch', function (qb) {
        qb.max('batch').from(getTableName(tableName, schemaName));
      })
      .orderBy('id', 'desc');

    const lastBatchMigrations = migrationNames.map((migration) => {
      return allMigrations.find((entry) => {
        return (
          this.config.migrationSource.getMigrationName(entry) === migration.name
        );
      });
    });
    return Promise.all(lastBatchMigrations);
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

    const useTransaction = isBoolean(singleTransactionValue)
      ? singleTransactionValue
      : !allTransactionsDisabled;

    return useTransaction;
  }

  // Runs a batch of `migrations` in a specified `direction`, saving the
  // appropriate database information as the migrations are run.
  _waterfallBatch(batchNo, migrations, direction, trx) {
    const trxOrKnex = trx || this.knex;
    const { tableName, schemaName, disableTransactions } = this.config;
    let current = Promise.resolve();
    const log = [];
    migrations.forEach((migration) => {
      const name = this.config.migrationSource.getMigrationName(migration);
      this._activeMigration.fileName = name;
      const migrationContent =
        this.config.migrationSource.getMigration(migration);

      const beforeEach = this.config.beforeEach || (() => {});
      const afterEach = this.config.afterEach || (() => {});

      // We're going to run each of the migrations in the current "up".
      current = current
        .then(async () => {
          if (!trx) {
            await this._confirmLock();
          }
          return await migrationContent; //maybe promise
        })
        .then(async (migrationContent) => {
          this._activeMigration.fileName = name;
          if (
            !trx &&
            this._useTransaction(migrationContent, disableTransactions)
          ) {
            this.knex.enableProcessing();
            return await this.knex.transaction(async (trx) => {
              await beforeEach(trx, [migration]);
              await this._confirmBeforeRunning(trx);
              const migrationResult = await checkPromise(
                this.knex.client.logger,
                migrationContent[direction](trx),
                name
              );
              await afterEach(trx, [migration]);
              return migrationResult;
            });
          }

          trxOrKnex.enableProcessing();
          await beforeEach(trxOrKnex, [migration]);
          if (!trx) {
            await this._confirmBeforeRunning();
          }
          const migrationResult = await checkPromise(
            this.knex.client.logger,
            migrationContent[direction](trxOrKnex),
            name
          );
          await afterEach(trxOrKnex, [migration]);
          return migrationResult;
        })
        .then(async () => {
          trxOrKnex.disableProcessing();
          this.knex.disableProcessing();
          const record = async (trx) => {
            if (direction === 'up') {
              await trx.into(getTableName(tableName, schemaName)).insert({
                name,
                batch: batchNo,
                migration_time: new Date(),
              });
            }
            if (direction === 'down') {
              await trx
                .from(getTableName(tableName, schemaName))
                .where({ name })
                .del();
            }
          };
          if (trx) {
            await record(trx);
          } else {
            // Confirming the lock in the transaction that records the migration
            // keeps a release or a takeover from landing between the two.
            await this.knex.transaction(async (recordTrx) => {
              await this._confirmLock(recordTrx);
              await record(recordTrx);
            });
          }
          log.push(name);
        });
    });

    return current.then(() => [batchNo, log]);
  }

  _transaction(knex, migrationContent, direction, name) {
    return knex.transaction((trx) => {
      return checkPromise(
        knex.client.logger,
        migrationContent[direction](trx),
        name,
        () => {
          trx.commit();
        }
      );
    });
  }
}

// Validates that migrations are present in the appropriate directories.
function validateMigrationList(migrationSource, migrations) {
  const [all, completed] = migrations;
  const diff = getMissingMigrations(migrationSource, completed, all);
  if (!isEmpty(diff)) {
    const names = diff.map((d) => d.name);
    throw new Error(
      `The migration directory is corrupt, the following files are missing: ${names.join(
        ', '
      )}`
    );
  }
}

function getMissingMigrations(migrationSource, completed, all) {
  return differenceWith(completed, all, (c, a) => {
    return c.name === migrationSource.getMigrationName(a);
  });
}

function getNewMigrations(migrationSource, all, completed) {
  return differenceWith(all, completed, (a, c) => {
    return c.name === migrationSource.getMigrationName(a);
  });
}

function lockedBy(current) {
  return new LockError(
    current
      ? `Migration table is already locked by ${
          current.holder
        } until ${new Date(current.expiresAt).toISOString()}`
      : 'Migration table is already locked'
  );
}

// lock_expires_at is a bigint column, so the expiry is kept in whole
// milliseconds, rounded up.
function expiresAt(now, lockTimeout) {
  return Math.ceil(now + lockTimeout);
}

function getLockTimeout({ lockTimeout }) {
  if (!Number.isFinite(lockTimeout) || lockTimeout <= 0) {
    throw new Error('lockTimeout must be a positive number of milliseconds');
  }
  return lockTimeout;
}

function checkPromise(logger, migrationPromise, name) {
  if (!migrationPromise || typeof migrationPromise.then !== 'function') {
    logger.warn(`migration ${name} did not return a promise`);
  }
  return migrationPromise;
}

module.exports = {
  Migrator,
};
