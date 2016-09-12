/*global describe*/

'use strict';

require('source-map-support').install();

global.sinon = require("sinon");

var chai = global.chai = require("chai");

chai.use(require("sinon-chai"));
chai.should();

var Promise   = global.testPromise = require('bluebird');
global.expect = chai.expect;
global.d      = new Date();

Promise.longStackTraces();

describe('Query Building Tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);

  require('./unit/query/builder')
  require('./unit/schema/mysql')('mysql')
  require('./unit/schema/mysql')('maria')
  require('./unit/schema/mysql')('mysql2')
  require('./unit/schema/postgres')
  require('./unit/schema/sqlite3')
  require('./unit/schema/oracle')
  require('./unit/schema/mssql')
  require('./unit/schema/oracledb')
})

describe('Configuration Tests', function () {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  
  require('./unit/knexfile-test')
})

describe('Integration Tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);

  require('./integration')
})
