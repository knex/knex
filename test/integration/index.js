module.exports = function(testSuite) {
  var Knex   = require('../../knex');
  var logger = require('./logger')(testSuite);
  var config = require('../knexfile');

  var mysql    = logger.client(Knex(config.mysql));
  var postgres = logger.client(Knex(config.postgres));
  var sqlite3  = logger.client(Knex(config.sqlite3));

  require('./suite')(mysql);
  require('./suite')(postgres);
  require('./suite')(sqlite3);
};