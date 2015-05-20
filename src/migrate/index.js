// Migrator
// -------
"use strict";

var fs       = require('fs');
var path     = require('path');
var _        = require('lodash');
var mkdirp   = require('mkdirp');
var Promise  = require('../promise');
var helpers  = require('../helpers');
var assign   = require('lodash/object/assign');

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
        return this._runBatch(_.difference(all, completed), 'up');
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
          return this._runBatch(_.pluck(migrations, 'name'), 'down');
        });
    })
  }

  // Retrieves and returns the current migration version
  // we're on, as a promise. If there aren't any migrations run yet,
  // return "none" as the value for the `currentVersion`.
  currentVersion(config) {
    this.config = this.setConfig(config);
    return this._listCompleted(config)
      .then((completed) => {
        var val = _.chain(completed).map(function(value) {
          return value.split('_')[0];
        }).max().value();
        return (val === -Infinity ? 'none' : val);
      })
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
    return Promise.promisify(fs.readdir, fs)(this._absoluteConfigDir())
      .then((migrations) => {
        return _.filter(migrations, function(value) {
          var extension = path.extname(value);
          return _.contains(['.co', '.coffee', '.iced', '.js', '.litcoffee', '.ls'], extension);
        }).sort();
      })
  }

  // Ensures a folder for the migrations exist, dependent on the
  // migration config settings.
  _ensureFolder() {
    var dir = this._absoluteConfigDir();
    return Promise.promisify(fs.stat, fs)(dir)
      .catch(function() {
        return Promise.promisify(mkdirp)(dir);
      });
  }

  // Ensures that the proper table has been created,
  // dependent on the migration config settings.
  _ensureTable() {
    var table = this.config.tableName;
    return this.knex.schema.hasTable(table)
      .then((exists) => {
        if (!exists) return this._createMigrationTable(table);
      });
  }

  // Create the migration table, if it doesn't already exist.
  _createMigrationTable(tableName) {
    return this.knex.schema.createTable(tableName, function(t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    });
  }

  // Run a batch of current migrations, in sequence.
  _runBatch(migrations, direction) {
    return Promise.all(_.map(migrations, this._validateMigrationStructure, this))
      .then(() => this._latestBatchNumber())
      .then((batchNo) => {
        if (direction === 'up') batchNo++;
        return batchNo;
      })
      .then((batchNo) => {
        return this._waterfallBatch(batchNo, migrations, direction)
      })
      .catch((error) => {
        helpers.warn('migrations failed with error: ' + error.message)
        throw error
      })
  }

  // Validates some migrations by requiring and checking for an `up` and `down` function.
  _validateMigrationStructure(name) {
    var migration = require(path.join(this._absoluteConfigDir(), name));
    if (typeof migration.up !== 'function' || typeof migration.down !== 'function') {
      throw new Error('Invalid migration: ' + name + ' must have both an up and down function');
    }
    return name;
  }

  // Lists all migrations that have been completed for the current db, as an array.
  _listCompleted() {
    var tableName = this.config.tableName
    return this._ensureTable(tableName)
      .then(() => this.knex(tableName).orderBy('id').select('name'))
      .then((migrations) => _.pluck(migrations, 'name'))
  }

  // Gets the migration list from the specified migration directory,
  // as well as the list of completed migrations to check what
  // should be run.
  _migrationData() {
    return Promise.all([
      this._listAll(),
      this._listCompleted()
    ]);
  }

  // Generates the stub template for the current migration, returning a compiled template.
  _generateStubTemplate() {
    var stubPath = this.config.stub || path.join(__dirname, 'stub', this.config.extension + '.stub');
    return Promise.promisify(fs.readFile, fs)(stubPath).then(function(stub) {
      return _.template(stub.toString(), null, {variable: 'd'});
    });
  }

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  _writeNewMigration(name, tmpl) {
    var config = this.config;
    var dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    var filename  = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return Promise.promisify(fs.writeFile, fs)(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  }

  // Get the last batch of migrations, by name, ordered by insert id
  // in reverse order.
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

  // Runs a batch of `migrations` in a specified `direction`,
  // saving the appropriate database information as the migrations are run.
  _waterfallBatch(batchNo, migrations, direction) {
    var knex = this.knex;
    var {tableName, disableTransactions} = this.config
    var directory = this._absoluteConfigDir()
    var current   = Promise.bind({failed: false, failedOn: 0});
    var log       = [];
    _.each(migrations, (migration) => {
      var name  = migration;
      migration = require(directory + '/' + name);

      // We're going to run each of the migrations in the current "up"
      current = current.then(() => {
        if (disableTransactions) {
          return warnPromise(migration[direction](knex, Promise), name)
        }
        return this._transaction(migration, direction, name)
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
    return assign({
      extension: 'js',
      tableName: 'knex_migrations',
      directory: './migrations'
    }, this.config || {}, config);
  }

}

// Validates that migrations are present in the appropriate directories.
function validateMigrationList(migrations) {
  var all = migrations[0];
  var completed = migrations[1];
  var diff = _.difference(completed, all);
  if (!_.isEmpty(diff)) {
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

// Ensure that we have 2 places for each of the date segments
function padDate(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
}

// Get a date object in the correct format, without requiring
// a full out library like "moment.js".
function yyyymmddhhmmss() {
  var d = new Date();
  return d.getFullYear().toString() +
      padDate(d.getMonth() + 1) +
      padDate(d.getDate()) +
      padDate(d.getHours()) +
      padDate(d.getMinutes()) +
      padDate(d.getSeconds());
}
