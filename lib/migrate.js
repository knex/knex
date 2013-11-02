// Migrate
// -------
"use strict";

var fs       = require('fs');
var path     = require('path');
var _        = require('underscore');
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
    this.config = _.defaults(config || {}, {
      extension: 'js',
      tableName: 'knex_migrations',
      directory: process.cwd() + '/migrations'
    });
    return Promise.bind(this).all([
      this.ensureFolder(config),
      this.ensureTable(config)
    ]);
  },

  // Ensures that the proper table has been created,
  // dependent on the migration config settings.
  ensureTable: function(config) {
    var migration = this;
    return this.knex.schema.hasTable(config.tableName)
      .then(function(exists) {
        debugger
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

  // Runs a specific migration, based on the migration version number.
  run: function(version, config) {
    version = parseVersion(version);
    var migration = this;
    return this.init(config)
      .then(this.migrationData)
      .spread(function(all, completed) {
        if (!migration.hasRun(completed, version)) {
          return migration.runBatch([getMigration(all, version, config)]);
        } else {
          throw new Error('Migration ' + version + ' already exists');
        }
      })
      .bind()
      .yield('Migration ' + version + ' successfully run');
  },

  // Migrate "up" to a specific migration id
  // otherwise, migrates all migrations which have
  // not been run yet.
  up: function(version, config) {
    return this.direction('up', version, config);
  },

  // Migrate "down" to a specific migration id,
  // otherwise rolls back the last migration "batch".
  down: function(version, config) {
    return this.direction('down', version, config);
  },

  // Run a batch of current migrations, in sequence.
  runBatch: function(migrations, direction) {
    var knex = this.knex;
    return Promise.then(function() {
      return Promise.map(migrations, function(item) {
        var migration = require(item);
        if (!_.isFunction(migration.up) || !_.isFunction(migration.down)) {
          throw new Error('Invalid migration: ' + item + ' must have both an up and down function');
        }
        return migration;
      });
    }).then(function(migrations) {
      var current = Promise.fulfilled();
      _.each(migrations, function(migration) {
        current = current.then(function() {
          migration[direction](knex, Promise.fulfilled());
        });
      });
      return current;
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
  generate: function(name, config) {
    if (!name) Promise.rejected(new Error('A name must be specified for the generated migration'));
    return this.init(config).then(function() {
      var readFile = Promise.promisify(fs.readFile, fs);
      return readFile(this.config.stub || path.join(__dirname, 'stub', this.config.extension + '.stub'));
    }).then(function(stub) {
      name = dasherize(name);
      if (name[0] === '-') name = name.slice(1);
      var filename  = yyyymmddhhmmss() + '_' + name + '.' + this.config.extension;
      var writeFile = Promise.promisify(fs.writeFile, fs);
      return writeFile(path.join(this.config.directory, filename), stub).yield(filename);
    }).bind();
  },

  // Lists all available migration versions, as an array.
  listAll: function(config) {
    return this.init(config)
      .then(function() {
        return Promise.promisify(fs.readdir, fs)(this.config.directory);
      })
      .then(function(files) {
        return _.reduce(files, function(memo, value) {
          memo.push(value);
          return memo;
        }, []);
      })
      .bind();
  },

  // Lists all migrations that have been completed for the current db, as an array.
  listCompleted: function(config) {
    return this.init(config)
      .then(function() {
        return this.knex(this.config.tableName).orderBy('id').select('name');
      })
      .bind();
  },

  // Check if the current migration has run.
  hasRun: function(versions, check) {
    return _.some(versions, function(version) {
      return (version.indexOf(check) === 0);
    });
  },

  // Shared between the `up` and `down` migrations, this
  // helps to create the batch of migrations that need to be run.
  direction: function(direction, version, config) {
    version = parseVersion(version || 'latest');
    return this.ensureTable(config)
      .then(this.migrationData)
      .spread(function(all, completed, version) {

      });
  },

  // Gets the migration list from the specified migration directory,
  // as well as the list of completed migrations to check what
  // should be run.
  migrationData: function() {
    return Promise.all([
      this.listAll(),
      this.listCompleted()
    ]);
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
