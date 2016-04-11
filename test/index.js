/*global describe*/

'use strict';

global.sinon = require("sinon");

var chai = global.chai = require("chai");

chai.use(require("sinon-chai"));
chai.should();

var Promise   = global.testPromise = require('../lib/promise');
global.expect = chai.expect;
global.d      = new Date();

Promise.longStackTraces();

describe('Query Building Tests', function() {
  require('./unit/query/builder')
  require('./unit/schema/mysql')('mysql')
  require('./unit/schema/mysql')('maria')
  require('./unit/schema/mysql')('mysql2')
  require('./unit/schema/postgres')
  require('./unit/schema/sqlite3')
  require('./unit/schema/oracle')
  require('./unit/schema/mssql')
})

describe('Integration Tests', function() {
  require('./integration')
})
