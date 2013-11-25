
var Promise = require('../promise').Promise;
var Helpers = require('../helpers').Helpers;

var Knex    = require('../../knex');

var colors  = require('colors');
var path    = require('path');
var _       = require('underscore');
var fs      = Promise.promisifyAll(require('fs'));
var knex;

// The CLI options for running migrations
module.exports = function(commands) {

  commands['migrate'] = function(argv) {
    checkConfig(argv).then(function(config) {
      return knex.migrate.latest(config);
    }).otherwise(function(err) {
      console.log(err.stack);
    }).then(destroyPool);
  };

  commands['migrate'].help = 'runs migrations that have not run yet';

  commands['migrate:make'] = function(argv) {
    var name = argv._[1];
    if (name == null) err('The name must be defined');
    checkConfig(argv).then(function(config) {
      return knex.migrate.make(name, config);
    }).otherwise(function(err) {
      console.log(err.stack);
    }).then(destroyPool);
  };

  commands['migrate:make'].help = 'generates a new migration';

  commands['migrate:up'] = function(argv) {
    checkConfig(argv);
  };

  commands['migrate:down'] = function(argv) {

  };

};

function checkConfig(argv) {
  if (!(configFile = (argv.c || argv.config))) {
    configFile = path.join(process.cwd(), 'config.js');
  }
  return fs.statAsync(configFile).then(function() {
    return require(configFile);
  }).tap(function(config) {
    if (config.database instanceof Knex) {
      knex = config.database;
    } else {
      knex = Knex(config.database);
    }
  });
}

function err(msg) {
  console.log(msg.red);
  process.exit();
}

function destroyPool() {
  knex.client.pool.destroy();
}
