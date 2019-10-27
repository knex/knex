'use strict';

const knex = require('../../knex');
const logger = require('./logger');
const config = require('../knexfile');
const fs = require('fs');

Object.keys(config).forEach((dialectName) => {
  require('./connection-config-provider')(config[dialectName]);
  return require('./suite')(logger(knex(config[dialectName])));
});

before(function() {
  if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
    fs.copyFileSync(
      __dirname + '/../multilineCreateMasterSample.sqlite3',
      __dirname + '/../multilineCreateMaster.sqlite3'
    );
  }
});

after(function() {
  if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
    fs.unlinkSync(config.sqlite3.connection.filename);
    fs.unlinkSync(__dirname + '/../multilineCreateMaster.sqlite3');
  }
});
