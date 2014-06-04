global.sinon = require("sinon");

var chai = global.chai = require("chai");

chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
chai.should();

var Promise = global.testPromise = require('../lib/promise');
global.expect         = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion      = chai.Assertion;
global.assert         = chai.assert;
global.d = new Date;

Promise.longStackTraces();

var knex = require('../knex');

var maria    = knex({client: 'maria'});
var mysql    = knex({client: 'mysql'});
var sqlite3  = knex({client: 'sqlite3'});
var postgres = knex({client: 'postgres'});

describe('Unit tests', function() {
  require('./unit/schema/postgresql')(postgres.client);
  require('./unit/schema/sqlite3')(sqlite3.client);
  require('./unit/schema/mysql')(mysql.client);
  require('./unit/schema/mysql')(maria.client);
  require('./unit/query/builder')(postgres.client, mysql.client, sqlite3.client);
});

// Integration Tests
describe('Integration Tests', function() {
  require('./integration')(this);
});
