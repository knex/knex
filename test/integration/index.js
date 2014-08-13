module.exports = function(testSuite) {
  var Knex   = require('../../knex');
  var logger = require('./logger')(testSuite);
  var config = require('../knexfile');
  var fs     = require('fs');

  var mysql    = logger.client(Knex(config.mysql));
  var mysql2   = logger.client(Knex(config.mysql2));
  var maria    = logger.client(Knex(config.maria));
  var postgres = logger.client(Knex(config.postgres));
  var sqlite3  = logger.client(Knex(config.sqlite3));

  require('./suite')(mysql);
  require('./suite')(mysql2);
  require('./suite')(maria);
  require('./suite')(postgres);
  require('./suite')(sqlite3);

  after(function(done) {
    if (config.sqlite3.connection.filename !== ':memory:') {
      fs.unlink(config.sqlite3.connection.filename, function(err) { done(); });
    } else {
      done();
    }
  });

};