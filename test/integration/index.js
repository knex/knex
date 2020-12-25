'use strict';

const knex = require('../../knex');
const logger = require('./logger');
const config = require('../knexfile');
const fs = require('fs');

Object.keys(config).forEach((dialectName) => {
  console.log(`Loading integration suite for dialect ${dialectName}`);
  const resolvedConfig = config[dialectName];
  if (!resolvedConfig) {
    throw new Error(`Unknown dialect ${dialectName}`);
  }

  require('./connection-config-provider')(resolvedConfig);
  return require('./suite')(logger(knex(resolvedConfig)));
});

before(function () {
  if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
    fs.copyFileSync(
      __dirname + '/../multilineCreateMasterSample.sqlite3',
      __dirname + '/../multilineCreateMaster.sqlite3'
    );
  }
});

after(function () {
  if (config.sqlite3 && config.sqlite3.connection.filename !== ':memory:') {
    fs.unlinkSync(config.sqlite3.connection.filename);
    fs.unlinkSync(__dirname + '/../multilineCreateMaster.sqlite3');
  }
});
