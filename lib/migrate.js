var fs   = require('fs');
var path = require('path');

var _        = require('underscore');
var _str     = require('underscore.string');
var mkdirp   = require('mkdirp');
var when     = require('when');
var nodefn   = require('when/node/function');
var sequence = require('when/sequence');

// The new migration we're performing.
// Takes a `config` object, which has the name
// of the current migration (`main` if not otherwise specified)
var Migrate = function(Instance) {
  this.Knex = Instance;
  _.bindAll(this, 'currentVersion', 'createMigrationTable', '_migrationData');
};

Migrate.prototype = {

  // Initializes the migration, by creating the proper migration
  // file or database table, depending on the migration config settings.
  initialize: function(config) {
    config = _.defaults(config || {}, {
      extension: 'js',
      tableName: 'knex_migrations',
      namespace: 'main',
      directory: process.cwd() + '/migrations'
    });

    var Knex = this.Knex;
    var directory = config.directory;
    var tableName = config.tableName;

    return nodefn.call(fs.stat, directory).then(null, function() {
      return nodefn.call(mkdirp, directory);
    })
    .then(function() {
      return Knex.Schema.hasTable(tableName);
    })
    .tap(function(exists) {
      if (exists) this.createMigrationTable(tableName);
    })
    .yield(config);
  },

  // Create the migration table, if it doesn't already exist.
  createMigrationTable: function(tableName) {
    return Knex.Schema.createTable(tableName, function(t) {
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
    return this.initialize(config)
      .then(this._migrationData(config))
      .spread(function(all, completed) {
        if (!hasRun(completed, version)) {
          return migration.runBatch([getMigration(all, version, config)]);
        } else {
          throw new Error('Migration ' + version + ' already exists');
        }
      })
      .then(function() {
        return 'Migration ' + version + ' successfully run';
      });
  },

  // Migrate "up" to a specific migration id
  // otherwise, migrates all migrations which have
  // not been run yet.
  up: function(version, config) {
    return this._direction('up', version, config);
  },

  // Migrate "down" to a specific migration id,
  // otherwise rolls back the last migration "batch".
  down: function(version, config) {
    return this._direction('down', version, config);
  },

  // Run a batch of current migrations, in sequence.
  runBatch: function(migrations, direction) {
    migrations = _.map(migrations, function(item) {
      var migration = require(item);
      if (!_.isFunction(migration.up) || !_.isFunction(migration.down)) {
        throw new Error('Invalid migration: ' + item + ' must have both an up and down function');
      }
      return migration[direction];
    });
    return sequence(migrations);
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
  create: function(name, config) {
    return this.initialize(config).then(function(config) {
      return when.all([nodefn.call(fs.readFile, config.stub || path.join(__dirname, 'stub', config.extension + '.stub')), config]);
    }).spread(function(stub, config) {
      name = _str.dasherize(name);
      if (name[0] === '-') name = name.slice(1);
      var filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
      return nodefn.call(fs.writeFile, path.join(config.directory, filename), stub).then(function() {
        return filename;
      });
    });
  },

  // Lists all available migration versions, as an array.
  listAll: function(config) {
    return this.initialize(config)
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
    var Knex = this.Knex;
      return this.initialize(config).then(function(config) {
        return Knex(config.tableName).orderBy('id').select('name');
      }).then(function(values) {
        return values;
      });
  },

  // Gets the migration list, and the list of completed migrations
  // to check what should be run.
  _migrationData: function(config) {
    var migration = this;
    return function() {
      return when.all([migration.listAll(), migration.listCompleted()]);
    };
  },

  // Shared between the `up` and `down` migrations, this
  // helps to create the batch of migrations that need to be run.
  _direction: function(direction, version, config) {
    version = parseVersion(version || 'latest');
    var migration = this;
    return this.initialize(config).then(this._migrationData(config)).spread(function(all, completed, version) {

    });
  },

  // Gets the current migration.
  getMigration: function(all, version, config) {
    var found = _.find(all, function(item) {
      item.indexOf(version) === 0;
    });
    if (!found) throw new Error('Unable to locate the specified migration ' + version);
    return path.join(config.directory, found);
  },

  // Get all of the migrations that need to be run in the current batch.
  getMigrations: function(all, version, direction, config) {
    return _.reduce(all, function() {

    });
  },

  // Check if the current version of the query has run.
  hasRun: function(versions, check) {
    return _.some(versions, function(version) {
      return (version.indexOf(check) === 0);
    });
  },

  // Parse the version, which really only needs to be the
  // timestamp of the migration we wish to migrate to.
  parseVersion: function(version) {
    if (version !== 'latest') {
      version = version.slice(0, 14);
      if (version.length !== 14) {
        throw new Error('Invalid version number provided');
      }
    }
    return version;
  }

};

// Get a date object in this form
var yyyymmddhhmmss = function() {
  var d = new Date();
  return d.getFullYear().toString() + padDate(d.getMonth() + 1) + padDate(d.getDate()) + padDate(d.getHours()) + padDate(d.getMinutes()) + padDate(d.getSeconds());
};

// Ensure that we have 2 places for each of the date segments
var padDate = function(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
};


module.exports = Migrate;