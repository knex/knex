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
  require('./builder/query')
  require('./builder/schema/mysql')
  require('./builder/schema/postgres')
  require('./builder/schema/sqlite3')
  require('./builder/schema/oracle')  
})

describe('Integration Tests', function() {
  require('./integration')
})
