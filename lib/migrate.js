// Migrate (WIP)
// -------
"use strict";

// Just some common functions needed in multiple places within the library.


var fs       = require('fs');
var path     = require('path');

var _        = require('underscore');
var mkdirp   = require('mkdirp');
var when     = require('when');
var nodefn   = require('when/node/function');
var sequence = require('when/sequence');

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
    config = _.defaults(config || {}, {
      extension: 'js',
      tableName: 'knex_migrations',
      directory: process.cwd() + '/migrations'
    });
    return when.all([
      this.ensureFolder(config),
      this.ensureTable(config)
    ]).yield(config);
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
    return nodefn.call(fs.stat, config.directory)
      .otherwise(function() {
        return nodefn.call(mkdirp, config.directory);
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

  // Runs a specific migration, based on the migration version number.
  run: function(version, config) {
    version = parseVersion(version);
    var migration = this;
    return this.init(config)
      .then(this._migrationData)
      .spread(function(all, completed) {
        if (!migration.hasRun(completed, version)) {
          return migration.runBatch([getMigration(all, version, config)]);
        } else {
          throw new Error('Migration ' + version + ' already exists');
        }
      })
      .yield('Migration ' + version + ' successfully run');
  },

  // Migrate "up" to a specific migration id
  // otherwise, migrates all migrations which have
  // not been run yet.
  up: function(version, config) {
    return direction(this, 'up', version, config);
  },

  // Migrate "down" to a specific migration id,
  // otherwise rolls back the last migration "batch".
  down: function(version, config) {
    return direction(this, 'down', version, config);
  },

  // Run a batch of current migrations, in sequence.
  runBatch: function(migrations, direction) {
    var knex = this.knex;
    return when(true).then(function() {
      return _.map(migrations, function(item) {
        var migration = require(item);
        if (!_.isFunction(migration.up) || !_.isFunction(migration.down)) {
          throw new Error('Invalid migration: ' + item + ' must have both an up and down function');
        }
        return function() {
          migration[direction](knex, when);
        };
      });
    }).then(sequence);
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
  generate: function(name, config) {
    return this.init(config).then(function(config) {
      return when.all([nodefn.call(fs.readFile, config.stub || path.join(__dirname, 'stub', config.extension + '.stub')), config]);
    }).spread(function(stub, config) {
      name = dasherize(name);
      if (name[0] === '-') name = name.slice(1);
      var filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
      return nodefn.call(fs.writeFile, path.join(config.directory, filename), stub).yield(filename);
    });
  },

  // Lists all available migration versions, as an array.
  listAll: function(config) {
    return this.init(config)
      .then(function(config) {
        return nodefn.call(fs.readdir, config.directory);
      })
      .then(function(files) {
        return _.reduce(files, function(memo, value) {
          memo.push(value);
          return memo;
        }, []);
      });
  },

  // Lists all migrations that have been completed for the current db, as an array.
  listCompleted: function(config) {
    var knex = this.knex;
    return this.init(config)
      .then(function(config) {
        return knex(config.tableName).orderBy('id').select('name');
      });
  },

  // Check if the current migration has run.
  hasRun: function(versions, check) {
    return _.some(versions, function(version) {
      return (version.indexOf(check) === 0);
    });
  }

};

// Gets the current migration.
var getMigration = function(all, version, config) {
  var found = _.find(all, function(item) {
    item.indexOf(version) === 0;
  });
  if (!found) throw new Error('Unable to locate the specified migration ' + version);
  return path.join(config.directory, found);
};

// Gets the migration list from the specified migration directory,
// as well as the list of completed migrations to check what
// should be run.
var migrationData = function(migration) {
  return function(config) {
    return when.all([
      migration.listAll(),
      migration.listCompleted()
    ]);
  };
};

// Shared between the `up` and `down` migrations, this
// helps to create the batch of migrations that need to be run.
var direction = function(migration, direction, version, config) {
  version = parseVersion(version || 'latest');
  return migration.ensureTable(config)
    .then(migration._migrationData)
    .spread(function(all, completed, version) {

    });
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
