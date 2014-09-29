// Migrator
// -------
"use strict";

var fs       = require('fs');
var path     = require('path');
var _        = require('lodash');
var mkdirp   = require('mkdirp');
var Promise  = require('../promise');

// Validates that migrations are present in the appropriate directories.
function validateMigrationList(all, completed) {
  var diff = _.difference(completed, all);
  if (!_.isEmpty(diff)) {
    throw new Error(
      'The migration directory is corrupt, the following files are missing: ' + diff.join(', ')
    );
  }
}

// Ensure that we have 2 places for each of the date segments
var padDate = function(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
};

// Get a date object in the correct format, without requiring
// a full out library like "moment.js".
var yyyymmddhhmmss = function() {
  var d = new Date();
  return d.getFullYear().toString() +
      padDate(d.getMonth() + 1) +
      padDate(d.getDate()) +
      padDate(d.getHours()) +
      padDate(d.getMinutes()) +
      padDate(d.getSeconds());
};

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.
function Migrator(knex) {
  this.knex   = knex;
  this.config = this.setConfig(knex.client.migrationConfig);
}

// Migrators to the latest configuration.
Migrator.prototype.latest = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return this._migrationData()
    .tap(validateMigrationList)
    .bind(this)
    .spread(function(all, completed) {
      return this._runBatch(_.difference(all, completed), 'up');
    });
});

// Rollback the last "batch" of migrations that were run.
Migrator.prototype.rollback = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return this._migrationData()
    .tap(validateMigrationList)
    .bind(this)
    .then(this._getLastBatch)
    .then(function(migrations) {
      return this._runBatch(_.pluck(migrations, 'name'), 'down');
    });
});

// Retrieves and returns the current migration version
// we're on, as a promise. If there aren't any migrations run yet,
// return "none" as the value for the `currentVersion`.
Migrator.prototype.currentVersion = function(config) {
  this.config = this.setConfig(config);
  return this._listCompleted(config).then(function(completed) {
    var val = _.chain(completed).map(function(value) {
      return value.split('_')[0];
    }).max().value();
    return (val === -Infinity ? 'none' : val);
  });
};

// Creates a new migration, with a given name.
Migrator.prototype.make = function(name, config) {
  this.config = this.setConfig(config);
  if (!name) Promise.rejected(new Error('A name must be specified for the generated migration'));
  return this._ensureFolder(config)
    .bind(this)
    .then(this._generateStubTemplate)
    .then(this._writeNewMigration(name));
};

// Lists all available migration versions, as a sorted array.
Migrator.prototype._listAll = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return Promise.promisify(fs.readdir, fs)(this._absoluteConfigDir())
    .bind(this)
    .then(function(migrations) {
      return _.filter(migrations, function(value) {
        var extension = path.extname(value);
        return _.contains(['.co', '.coffee', '.iced', '.js', '.litcoffee', '.ls'], extension);
      }).sort();
    });
});

// Ensures a folder for the migrations exist, dependent on the
// migration config settings.
Migrator.prototype._ensureFolder = function() {
  var dir = this._absoluteConfigDir();
  return Promise.promisify(fs.stat, fs)(dir)
    .catch(function() {
      return Promise.promisify(mkdirp)(dir);
    });
};

// Ensures that the proper table has been created,
// dependent on the migration config settings.
Migrator.prototype._ensureTable = Promise.method(function() {
  var table = this.config.tableName;
  return this.knex.schema.hasTable(table)
    .bind(this)
    .then(function(exists) {
      if (!exists) return this._createMigrationTable(table);
    });
});

// Create the migration table, if it doesn't already exist.
Migrator.prototype._createMigrationTable = function(tableName) {
  return this.knex.schema.createTable(tableName, function(t) {
    t.increments();
    t.string('name');
    t.integer('batch');
    t.timestamp('migration_time');
  });
};

// Run a batch of current migrations, in sequence.
Migrator.prototype._runBatch = function(migrations, direction) {
  return Promise.all(_.map(migrations, this._validateMigrationStructure, this))
    .bind(this)
    .then(function(migrations) {
      return Promise.bind(this)
        .then(this._latestBatchNumber)
        .then(function(batchNo) {
          if (direction === 'up') batchNo++;
          return batchNo;
        })
        .then(function(batchNo) {
          return this._waterfallBatch(batchNo, migrations, direction);
        });
    });
};

// Validates some migrations by requiring and checking for an `up` and `down` function.
Migrator.prototype._validateMigrationStructure = function(name) {
  var migration = require(path.join(this._absoluteConfigDir(), name));
  if (!_.isFunction(migration.up) || !_.isFunction(migration.down)) {
    throw new Error('Invalid migration: ' + name + ' must have both an up and down function');
  }
  return name;
};

// Lists all migrations that have been completed for the current db, as an array.
Migrator.prototype._listCompleted = Promise.method(function() {
  var tableName = this.config.tableName;
  return this._ensureTable(tableName)
    .bind(this)
    .then(function () {
      return this.knex(tableName).orderBy('id').select('name');
    })
    .then(function(migrations) {
      return _.pluck(migrations, 'name');
    });
});

// Gets the migration list from the specified migration directory,
// as well as the list of completed migrations to check what
// should be run.
Migrator.prototype._migrationData = function() {
  return Promise.all([
    this._listAll(),
    this._listCompleted()
  ]);
};

// Generates the stub template for the current migration, returning a compiled template.
Migrator.prototype._generateStubTemplate = function() {
  var stubPath = this.config.stub || path.join(__dirname, 'stub', this.config.extension + '.stub');
  return Promise.promisify(fs.readFile, fs)(stubPath).then(function(stub) {
    return _.template(stub.toString(), null, {variable: 'd'});
  });
};

// Write a new migration to disk, using the config and generated filename,
// passing any `variables` given in the config to the template.
Migrator.prototype._writeNewMigration = function(name) {
  var config = this.config;
  var dir = this._absoluteConfigDir();
  return function(tmpl) {
    if (name[0] === '-') name = name.slice(1);
    var filename  = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return Promise.promisify(fs.writeFile, fs)(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  };
};

// Get the last batch of migrations, by name, ordered by insert id
// in reverse order.
Migrator.prototype._getLastBatch = function() {
  var knex = this.knex;
  var tableName = this.config.tableName;
  return this.knex(tableName)
    .where('batch', function() {
      this.select(knex.raw('MAX(batch)')).from(tableName);
    })
    .orderBy('id', 'desc');
};

// Returns the latest batch number.
Migrator.prototype._latestBatchNumber = function() {
  return this.knex(this.config.tableName)
    .max('batch as batchNo').then(function(obj) {
      return (obj[0].batchNo || 0);
    });
};

// Runs a batch of `migrations` in a specified `direction`,
// saving the appropriate database information as the migrations are run.
Migrator.prototype._waterfallBatch = function(batchNo, migrations, direction) {
  var knex      = this.knex;
  var tableName = this.config.tableName;
  var directory = this._absoluteConfigDir();
  var current   = Promise.bind({failed: false, failedOn: 0});
  var log       = [];
  _.each(migrations, function(migration) {
    var name  = migration;
    migration = require(directory + '/' + name);

    // We're going to run each of the migrations in the current "up"
    current = current.then(function() {
      return migration[direction](knex, Promise);
    }).then(function() {
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
  });

  return current.thenReturn([batchNo, log]);
};

Migrator.prototype._absoluteConfigDir = function() {
  return path.resolve(process.cwd(), this.config.directory);
};

Migrator.prototype.setConfig = function(config) {
  return _.extend({
    extension: 'js',
    tableName: 'knex_migrations',
    directory: '/migrations'
  }, this.config || {}, config);
};

module.exports = Migrator;
