/*global after*/

'use strict';

var knex   = require('../../knex');
var logger = require('./logger');
var config = require('../knexfile');
var fs     = require('fs');

var Promise = require('bluebird');

Promise.each(Object.keys(config), function(dialectName) {
  return require('./suite')(logger(knex(config[dialectName])));
});

after(function(done) {
  if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
    fs.unlink(config.sqlite3.connection.filename, function() { done(); });
  } else {
    done();
  }
});
