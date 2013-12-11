
var Promise = require('../promise').Promise;
var colors  = require('colors');
var path    = require('path');
var _       = require('lodash');
var fs      = Promise.promisifyAll(require('fs'));
var Knex, knex;

// The CLI options for running migrations
module.exports = function(commands) {

  commands['migrate'] = function(argv) {
    console.log('Did you mean migrate:latest?'.cyan);
  };

  commands['migrate:latest'] = function(argv) {
    checkConfig(argv).then(function(config) {
      return knex.migrate.latest(config);
    })
    .spread(function(batchNo, log) {
      if (log.length === 0) {
        console.log('Already up to date'.cyan);
      } else {
        console.log(('Batch ' + batchNo + ' run: ' + log.length + ' migrations \n').green +
          log.join('\n').cyan);
      }
    })
    .catch(logError)
    .finally(exit);
  };

  commands['migrate:latest'].help = 'runs migrations that have not run yet';

  commands['migrate:make'] = function(argv) {
    var name = argv._[1];
    if (name == null) return err('The name must be defined');
    checkConfig(argv).then(function(config) {
      return knex.migrate.make(name, config);
    }).then(function(filename) {
      console.log(('Migration ' + filename + ' created!').green);
    })
    .catch(logError)
    .finally(exit);
  };

  commands['migrate:make'].help = 'generates a new migration';

  commands['migrate:rollback'] = function(argv) {
    checkConfig(argv).then(function(config) {
      return knex.migrate.rollback(config);
    })
    .spread(function(batchNo, log) {
      if (log.length === 0) {
        console.log('Already at the base migration'.cyan);
      } else {
        console.log(('Batch ' + batchNo + ' rolled back: ' + log.length + ' migrations \n').green +
          log.join('\n').cyan);
      }
    })
    .catch(logError)
    .finally(exit);
  };

  commands['migrate:rollback'].help = 'rolls back the latest migration group';

  commands['migrate:currentVersion'] = function(argv) {
    checkConfig(argv).then(function(config) {
      return knex.migrate.currentVersion(config);
    })
    .then(function(version) {
      console.log('Current Version: '.green + version.blue);
    })
    .catch(logError)
    .finally(exit);
  };

};

var checkConfig = function(argv) {
  var configFile = argv.c || argv.config;
  if (!configFile) {
    configFile = path.join(process.cwd(), 'config.js');
  }
  return fs.statAsync(configFile).then(function() {
    return require(path.resolve(configFile));
  }).tap(function(config) {
    config.projectRoot = config.projectRoot || process.cwd();

    // Try to use the Knex install local to the current project, so that we're
    // resolving to the locally installed database driver.
    if (!Knex) {
      try {
        Knex = require(path.join(config.projectRoot, 'node_modules/knex'));
      } catch (e) {
        Knex = require('../../knex');
      }
    }

    if (config.database.client && (config.database.client instanceof Knex.ClientBase)) {
      knex = config.database;
    } else {
      knex = Knex(config.database);
    }
  });
};

var logError = function(err) {
  console.log(err.stack);
};

var err = function(msg) {
  console.log(msg.red);
};

var exit = function() {
  if (knex && knex.client) {
    knex.client.pool.destroy();
  }
  process.exit();
};