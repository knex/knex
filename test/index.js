/*global describe*/

'use strict';

global.sinon = require("sinon");

var chai = global.chai = require("chai");

chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
chai.should();

var Promise           = global.testPromise = require('../lib/promise');
global.expect         = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion      = chai.Assertion;
global.assert         = chai.assert;
global.d              = new Date();

Promise.longStackTraces();

describe('Query Building Tests', function() {
  require('./unit/query/builder')
  require('./unit/schema/mysql')
  require('./unit/schema/postgres')
  require('./unit/schema/sqlite3')
  require('./unit/schema/oracle')  
})

describe('Integration Tests', function() {
  require('./integration')
})
