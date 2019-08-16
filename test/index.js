'use strict';

require('source-map-support').install();

global.sinon = require('sinon');

const chai = (global.chai = require('chai'));

chai.use(require('sinon-chai'));
chai.should();

const bluebird = require('bluebird');
global.expect = chai.expect;
global.d = new Date();

bluebird.longStackTraces();

// '.timeout(ms, {cancel: true}) should throw error if cancellation cannot acquire connection' produced unhandled rejection and it's unclear how to avoid that
const EXPECTED_REJECTION_COUNT = 2;
const rejectionLog = [];
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  rejectionLog.push({
    reason,
  });
});

process.on('exit', (code) => {
  if (rejectionLog.length) {
    console.error(`Unhandled rejections: ${rejectionLog.length}`);
    rejectionLog.forEach((rejection) => {
      console.error(rejection);
    });

    if (rejectionLog.length > EXPECTED_REJECTION_COUNT) {
      process.exitCode = code || 1;
    }
  }
  console.log('No unhandled exceptions');
});

describe('Query Building Tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);

  require('./unit/query/builder');
  require('./unit/schema/mysql')('mysql');
  require('./unit/schema/mysql')('mysql2');
  require('./unit/schema/postgres');
  require('./unit/schema/redshift');
  require('./unit/schema/sqlite3');
  require('./unit/schema/oracle');
  require('./unit/schema/mssql');
  require('./unit/schema/oracledb');
  require('./unit/migrate/migration-list-resolver');
  require('./unit/seed/seeder');
  // require('./unit/interface'); ToDo Uncomment after fixed
  require('./unit/knex');
});

describe('Integration Tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  require('./integration');
});

const config = require('./knexfile');
if (config.oracledb) {
  describe('Oracledb driver tests', function() {
    this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
    require('./unit/dialects/oracledb');
  });
}

if (config.postgres) {
  require('./unit/dialects/postgres');
}

if (config.sqlite3) {
  describe('Sqlite driver tests', function() {
    this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
    require('./unit/dialects/sqlite3');
  });
}

describe('CLI tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  require('./cli/knexfile-test.spec');
  require('./cli/migrate-make.spec');
  require('./cli/version.spec');
});
