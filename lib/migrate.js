// Migrate
// -------
"use strict";

var fs       = require('fs');
var path     = require('path');
var _        = require('lodash');
var mkdirp   = require('mkdirp');

var Promise  = require('./promise').Promise;

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.
var Migrate = function(instance) {
  this.knex = instance;
};

Migrate.prototype = {

  // Initializes the migration, taking an optional `config` object,
  // for things like the `tableName`.
  init: function(config) {
    if (!this._init) {
      this.config = _.defaults(config || {}, {
        extension: 'js',
        tableName: 'knex_migrations',
        directory: process.cwd() + '/migrations'
      });
      if (this.config.directory.indexOf('./') === 0) {
        this.config.directory = path.resolve(process.cwd(), this.config.directory);
      }
      this._init = Promise.all([
        this.ensureFolder(this.config),
        this.ensureTable(this.config)
      ]).bind(this);
    }
    return this._init;
  },

  // Ensures that the proper table has been created,
  // dependent on the migration config settings.
  ensureTable: function(config) {
    var migration = this;
    return this.knex.schema.hasTable(config.tableName)
      .then(function(exists) {
        if (!exists) return migration.createMigrationTable(config.tableName);
      });
  },

  // Ensures a folder for the migrations exist, dependent on the
  // migration config settings.
  ensureFolder: function(config) {
    return Promise.promisify(fs.stat, fs)(config.directory)
      .catch(function() {
        return Promise.promisify(mkdirp)(config.directory);
      });
  },

  // Create the migration table, if it doesn't already exist.
  createMigrationTable: function(tableName) {
    return this.knex.schema.createTable(tableName, function(t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.dateTime('migration_time');
    });
  },

  // Migrates to the latest configuration.
  latest: function(config) {
    return this.init(config)
      .then(this.migrationData)
      .tap(validateMigrationList)
      .spread(function(all, completed) {
        return this.runBatch(_.difference(all, completed), 'up');
      })
      .bind();
  },

  // Rollback the last "batch" of migrations that were run.
  rollback: function(config) {
    return this.init(config)
      .then(this.migrationData)
      .tap(validateMigrationList)
      .then(this.getLastBatch)
      .then(function(migrations) {
        return this.runBatch(_.pluck(migrations, 'name'), 'down');
      })
      .bind();
  },

  // Run a batch of current migrations, in sequence.
  runBatch: function(migrations, direction) {
    return Promise.map(migrations, validateMigrationStructure(this))
    .bind(this)
    .then(function(migrations) {
      return this.latestBatchNumber().then(function(batchNo) {
        if (direction === 'up') batchNo++;
        return batchNo;
      }).then(this.waterfallBatch(migrations, direction));
    });
  },

  // Retrieves and returns the current migration version
  // we're on, as a promise. If there aren't any migrations run yet,
  // return "none" as the value for the `currentVersion`.
  currentVersion: function(config) {
    return this.listCompleted(config).then(function(completed) {
      var val = _.chain(completed).map(function(value) {
        return value.split('_')[0];
      }).max().value();
      return (val === -Infinity ? 'none' : val);
    });
  },

  // Creates a new migration, with a given name.
  make: function(name, config) {
    if (!name) Promise.rejected(new Error('A name must be specified for the generated migration'));
    return this.init(config)
      .then(this.generateStubTemplate)
      .then(this.writeNewMigration(name));
  },

  // Lists all available migration versions, as a sorted array.
  listAll: function(config) {
    return this.init(config)
      .then(function() {
        return Promise.promisify(fs.readdir, fs)(this.config.directory);
      })
      .then(function(migrations) {
        var ext = this.config.extension;
        return _.filter(migrations, function (value) {
          return value.indexOf(ext, value.length - ext.length) !== -1;
        }).sort();
      });
  },

  // Lists all migrations that have been completed for the current db, as an array.
  listCompleted: function(config) {
    return this.init(config)
      .then(function() {
        return this.knex(this.config.tableName).orderBy('id').select('name');
      })
      .then(function(migrations) {
        return _.pluck(migrations, 'name');
      })
      .bind();
  },

  // Gets the migration list from the specified migration directory,
  // as well as the list of completed migrations to check what
  // should be run.
  migrationData: function() {
    return Promise.all([
      this.listAll(),
      this.listCompleted()
    ]);
  },

  // Generates the stub template for the current migration, returning a compiled template.
  generateStubTemplate: function() {
    var stubPath = this.config.stub || path.join(__dirname, 'stub', this.config.extension + '.stub');
    return Promise.promisify(fs.readFile, fs)(stubPath).then(function(stub) {
      return _.template(stub.toString(), null, {variable: 'd'});
    });
  },

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  writeNewMigration: function(name) {
    var config = this.config;
    return function(tmpl) {
      if (name[0] === '-') name = name.slice(1);
      var filename  = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
      return Promise.promisify(fs.writeFile, fs)(
        path.join(config.directory, filename),
        tmpl(config.variables || {})
      ).yield(filename);
    };
  },

  // Get the last batch of migrations, by name, ordered by insert id
  // in reverse order.
  getLastBatch: function() {
    var knex = this.knex;
    var tableName = this.config.tableName;
    return this.knex(tableName)
      .where('batch', function() {
        this.select(knex.raw('MAX(batch)')).from(tableName);
      })
      .orderBy('id', 'desc');
  },

  // Returns the latest batch number.
  latestBatchNumber: function() {
    return this.knex(this.config.tableName)
      .max('batch as batchNo').then(function(obj) {
        return (obj[0].batchNo || 0);
      });
  },

  // Runs a batch of `migrations` in a specified `direction`,
  // saving the appropriate database information as the migrations are run.
  waterfallBatch: function(migrations, direction) {
    var knex      = this.knex;
    var tableName = this.config.tableName;
    var current   = Promise.fulfilled().bind({failed: false, failedOn: 0});
    var log       = [];
    return function(batchNo) {
      _.each(migrations, function(migration, i) {
        var name  = migration[0];
        migration = migration[1];

        // We're going to run each of the migrations in the current "up"
        current = current.then(function() {
          return migration[direction](knex, Promise);
        }).then(function() {
          log.push(name);
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
      return current.yield([batchNo, log]);
    };
  }

};

// Validates some migrations by requiring and checking for an `up` and `down` function,
// returning an array with the `item` and `migration` require.
function validateMigrationStructure(migrator) {
  return function(item) {
    var migration = require(migrator.config.directory + '/' + item);
    if (!_.isFunction(migration.up) || !_.isFunction(migration.down)) {
      throw new Error('Invalid migration: ' + item + ' must have both an up and down function');
    }
    return [item, migration];
  };
}

// Validates that migrations are present in the appropriate directories.
function validateMigrationList(all, completed) {
  var diff = _.difference(completed, all);
  if (!_.isEmpty(diff)) {
    throw new Error(
      'The migration directory is corrupt, the following files are missing: ' + diff.join(', ')
    );
  }
}

// Gets the current migration.
var getMigration = function(all, version, config) {
  var found = _.find(all, function(item) {
    item.indexOf(version) === 0;
  });
  if (!found) throw new Error('Unable to locate the specified migration ' + version);
  return path.join(config.directory, found);
};

// Parse the version, which really only needs to be the
// timestamp of the migration we wish to migrate to.
var parseVersion = function(version) {
  if (version !== 'latest') {
    version = version.slice(0, 14);
    if (version.length !== 14) {
      throw new Error('Invalid migration provided');
    }
  }
  return version;
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

// Ensure that we have 2 places for each of the date segments
var padDate = function(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
};

// Dasherize the string.
var dasherize = function(str) {
  return str.replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
};

module.exports = Migrate;
