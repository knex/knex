'use strict';

const knex = require('../../knex');
const logger = require('./logger');
const config = require('../knexfile');
const fs = require('fs');

const Bluebird = require('bluebird');

Object.keys(config).forEach((dialectName) => {
  return require('./suite')(logger(knex(config[dialectName])));
});

after(function(done) {
  if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
    fs.unlink(config.sqlite3.connection.filename, function() {
      done();
    });
  } else {
    done();
  }
});
