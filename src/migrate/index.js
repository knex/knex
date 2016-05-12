// Migrator
// -------
"use strict";

var fs       = require('fs');
var path     = require('path');
var mkdirp   = require('mkdirp');
var Promise  = require('../promise');
var helpers  = require('../helpers');
import {assign, difference, chain, filter, includes, map, template, get, isBoolean, each, isEmpty, isUndefined, bind} from 'lodash'
var inherits = require('inherits');

function LockError(msg) {
  this.name = 'MigrationLocked';
  this.message = msg;
}
inherits(LockError, Error);

const CONFIG_DEFAULT = Object.freeze({
  extension: 'js',
  tableName: 'knex_migrations',
  directory: './migrations',
  disableTransactions: false
});

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.
export default class Migrator {

  constructor(knex) {
    this.knex   = knex
    this.config = this.setConfig(knex.client.config.migrations);
  }

  // Migrators to the latest configuration.
  latest(config) {
    this.config = this.setConfig(config);
    return this._migrationData()
      .tap(validateMigrationList)
      .spread((all, completed) => {
        return this._runBatch(difference(all, completed), 'up');
      })
  }

  // Rollback the last "batch" of migrations that were run.
  rollback(config) {
    return Promise.try(() => {
      this.config = this.setConfig(config);
      return this._migrationData()
        .tap(validateMigrationList)
        .then((val) => this._getLastBatch(val))
        .then((migrations) => {
          return this._runBatch(map(migrations, 'name'), 'down');
        });
    })
  }

  status(config) {
    this.config = this.setConfig(config);

    return Promise.all([
      this.knex(this.config.tableName).select('*'),
      this._listAll()
    ])
    .spread(function(db, code) {
      return db.length - code.length;
    });

  }

  // Retrieves and returns the current migration version we're on, as a promise.
  // If no migrations have been run yet, return "none".
  currentVersion(config) {
    this.config = this.setConfig(config);
    return this._listCompleted(config)
      .then((completed) => {
        var val = chain(completed).map(function(value) {
          return value.split('_')[0];
        }).max().value();
        return (isUndefined(val) ? 'none' : val);
      })
  }

  forceFreeMigrationsLock(config) {
    this.config = this.setConfig(config);
    var lockTable = this._getLockTableName();
    return this.knex.schema.hasTable(lockTable)
        .then(exist => exist && this._freeLock());
  }

  // Creates a new migration, with a given name.
  make(name, config) {
    this.config = this.setConfig(config);
    if (!name) Promise.rejected(new Error('A name must be specified for the generated migration'));
    return this._ensureFolder(config)
      .then((val) => this._generateStubTemplate(val))
      .then((val) => this._writeNewMigration(name, val));
  }

  // Lists all available migration versions, as a sorted array.
  _listAll(config) {
    this.config = this.setConfig(config);
    return Promise.promisify(fs.readdir, {context: fs})(this._absoluteConfigDir())
      .then((migrations) => {
        return filter(migrations, function(value) {
          var extension = path.extname(value);
          return includes(['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls'], extension);
        }).sort();
      })
  }

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.
  _ensureFolder() {
    var dir = this._absoluteConfigDir();
    return Promise.promisify(fs.stat, {context: fs})(dir)
      .catch(function() {
        return Promise.promisify(mkdirp)(dir);
      });
  }

  // Ensures that a proper table has been created, dependent on the migration
  // config settings.
  _ensureTable() {
    var table = this.config.tableName;
    var lockTable = this._getLockTableName();
    return this.knex.schema.hasTable(table)
      .then(exists => !exists && this._createMigrationTable(table))
      .then(() => this.knex.schema.hasTable(lockTable))
      .then(exists => !exists && this._createMigrationLockTable(lockTable))
      .then(() => this.knex(lockTable).select('*'))
      .then(data => !data.length && this.knex(lockTable).insert({ is_locked: 0 }));
  }

  // Create the migration table, if it doesn't already exist.
  _createMigrationTable(tableName) {
    return this.knex.schema.createTableIfNotExists(tableName, function(t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    });
  }

  _createMigrationLockTable(tableName) {
    return this.knex.schema.createTableIfNotExists(tableName, function(t) {
      t.integer('is_locked');
    });
  }

  _getLockTableName() {
    return this.config.tableName + '_lock';
  }

  _isLocked(trx) {
    var tableName = this._getLockTableName();
    return this.knex(tableName)
      .transacting(trx)
      .forUpdate()
      .select('*')
      .then(data => data[0].is_locked);
  }

  _lockMigrations(trx) {
    var tableName = this._getLockTableName();
    return this.knex(tableName)
      .transacting(trx)
      .update({ is_locked: 1 });
  }

  _getLock() {
    return this.knex.transaction(trx => {
      return this._isLocked(trx)
        .then(isLocked => {
          if (isLocked) {
            throw new Error("Migration table is already locked");
          }
        })
        .then(() => this._lockMigrations(trx));
    }).catch(err => {
      throw new LockError(err.message);
    });
  }

  _freeLock() {
    var tableName = this._getLockTableName();
    return this.knex(tableName)
      .update({ is_locked: 0 });
  }

  // Run a batch of current migrations, in sequence.
  _runBatch(migrations, direction) {
    return this._getLock()
    .then(() => Promise.all(map(migrations, bind(this._validateMigrationStructure, this))))
    .then(() => this._latestBatchNumber())
    .then(batchNo => {
      if (direction === 'up') batchNo++;
      return batchNo;
    })
    .then(batchNo => {
      return this._waterfallBatch(batchNo, migrations, direction)
    })
    .tap(() => this._freeLock())
    .catch(error => {
      var cleanupReady = Promise.resolve();

      if (error instanceof LockError) {
        // If locking error do not free the lock.
        helpers.warn('Can\'t take lock to run migrations: ' + error.message);
        helpers.warn(
          'If you are sure migrations are not running you can release the ' +
          'lock manually by deleting all the rows from migrations lock ' +
          'table: ' + this._getLockTableName()
        );
      } else {
        helpers.warn('migrations failed with error: ' + error.message)
        // If the error was not due to a locking issue, then remove the lock.
        cleanupReady = this._freeLock();
      }

      return cleanupReady.finally(function() {
        throw error;
      });
    });
}

  // Validates some migrations by requiring and checking for an `up` and `down`
  // function.
  _validateMigrationStructure(name) {
    var migration = require(path.join(this._absoluteConfigDir(), name));
    if (typeof migration.up !== 'function' || typeof migration.down !== 'function') {
      throw new Error('Invalid migration: ' + name + ' must have both an up and down function');
    }
    return name;
  }

  // Lists all migrations that have been completed for the current db, as an
  // array.
  _listCompleted() {
    var tableName = this.config.tableName
    return this._ensureTable(tableName)
      .then(() => this.knex(tableName).orderBy('id').select('name'))
      .then((migrations) => map(migrations, 'name'))
  }

  // Gets the migration list from the specified migration directory, as well as
  // the list of completed migrations to check what should be run.
  _migrationData() {
    return Promise.all([
      this._listAll(),
      this._listCompleted()
    ]);
  }

  // Generates the stub template for the current migration, returning a compiled
  // template.
  _generateStubTemplate() {
    var stubPath = this.config.stub || path.join(__dirname, 'stub', this.config.extension + '.stub');
    return Promise.promisify(fs.readFile, {context: fs})(stubPath).then(function(stub) {
      return template(stub.toString(), {variable: 'd'});
    });
  }

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  _writeNewMigration(name, tmpl) {
    var config = this.config;
    var dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    var filename  = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return Promise.promisify(fs.writeFile, {context: fs})(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  }

  // Get the last batch of migrations, by name, ordered by insert id in reverse
  // order.
  _getLastBatch() {
    var tableName = this.config.tableName;
    return this.knex(tableName)
      .where('batch', function(qb) {
        qb.max('batch').from(tableName)
      })
      .orderBy('id', 'desc');
  }

  // Returns the latest batch number.
  _latestBatchNumber() {
    return this.knex(this.config.tableName)
      .max('batch as max_batch').then(function(obj) {
        return (obj[0].max_batch || 0);
      });
  }

  // If transaction config for a single migration is defined, use that.
  // Otherwise, rely on the common config. This allows enabling/disabling
  // transaction for a single migration at will, regardless of the common
  // config.
  _useTransaction(migration, allTransactionsDisabled) {
    var singleTransactionValue = get(migration, 'config.transaction');

    return isBoolean(singleTransactionValue) ?
      singleTransactionValue :
      !allTransactionsDisabled;
  }

  // Runs a batch of `migrations` in a specified `direction`, saving the
  // appropriate database information as the migrations are run.
  _waterfallBatch(batchNo, migrations, direction) {
    var knex = this.knex;
    var {tableName, disableTransactions} = this.config
    var directory = this._absoluteConfigDir()
    var current   = Promise.bind({failed: false, failedOn: 0});
    var log       = [];
    var ignoreErrors = knex.client.config.migrations.ignoreErrors || [];
    each(migrations, (migration) => {
      var name  = migration;
      migration = require(directory + '/' + name);

      // We're going to run each of the migrations in the current "up".
      current = current.then(() => {
        if (this._useTransaction(migration, disableTransactions)) {
          return this._transaction(migration, direction, name)
        }
        return warnPromise(migration[direction](knex, Promise), name)
      })
      .then(() => {
        log.push(path.join(directory, name));
        if (direction === 'up') {
          return knex(tableName).insert({
            name: name,
            batch: batchNo,
            migration_time: new Date()
          });
        }
        if (direction === 'down') {
          return knex(tableName).where({name: name}).del();
        }
      })
      .catch(e => {
        e.migrationName = name;
        if (ignoreErrors.indexOf(e.code) > -1) {
          log.push(e);
          return Promise.resolve();
        }
        throw e;
      });
    })

    return current.thenReturn([batchNo, log]);
  }

  _transaction(migration, direction, name) {
    return this.knex.transaction((trx) => {
      return warnPromise(migration[direction](trx, Promise), name, () => {
        trx.commit()
      })
    })
  }

  _absoluteConfigDir() {
    return path.resolve(process.cwd(), this.config.directory);
  }

  setConfig(config) {
    return assign({}, CONFIG_DEFAULT, this.config || {}, config);
  }

}

// Validates that migrations are present in the appropriate directories.
function validateMigrationList(migrations) {
  var all = migrations[0];
  var completed = migrations[1];
  var diff = difference(completed, all);
  if (!isEmpty(diff)) {
    throw new Error(
      'The migration directory is corrupt, the following files are missing: ' + diff.join(', ')
    );
  }
}

function warnPromise(value, name, fn) {
  if (!value || typeof value.then !== 'function') {
    helpers.warn(`migration ${name} did not return a promise`);
    if (fn && typeof fn === 'function') fn()
  }
  return value;
}

// Ensure that we have 2 places for each of the date segments.
function padDate(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
}

// Get a date object in the correct format, without requiring a full out library
// like "moment.js".
function yyyymmddhhmmss() {
  var d = new Date();
  return d.getFullYear().toString() +
      padDate(d.getMonth() + 1) +
      padDate(d.getDate()) +
      padDate(d.getHours()) +
      padDate(d.getMinutes()) +
      padDate(d.getSeconds());
}
