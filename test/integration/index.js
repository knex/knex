/*global after*/

'use strict';

module.exports = function(testSuite) {
  var Knex   = require('../../knex');
  var logger = require('./logger')(testSuite);
  var config = require('../knexfile');
  var fs     = require('fs');

  Object.keys(config).forEach(function (dialectName) {
    require('./suite')(logger.client(Knex(config[dialectName])));
  });

  after(function(done) {
    if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
      fs.unlink(config.sqlite3.connection.filename, function(err) { done(); });
    } else {
      done();
    }
  });

};
