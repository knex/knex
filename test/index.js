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

var mysql    = knex({client: 'mysql'});
var sqlite3  = knex({client: 'sqlite3'});
var postgres = knex({client: 'postgres'});

describe('Unit tests', function() {
  require('./unit/schema/postgresql')(postgres.client);
  require('./unit/schema/sqlite3')(sqlite3.client);
  require('./unit/schema/mysql')(mysql.client);
  require('./unit/query/builder')(postgres.client, mysql.client, sqlite3.client);

  it('provides a knex.utils.prepInsert for normalizing js objects', function() {
    var data = [{a: 1}, {b: 2}, {a: 2, c: 3}];
    var dataPrepped = mysql.utils.prepInsert(data);
    assert.deepEqual(dataPrepped, [
      {a: 1, b: void 0, c: void 0},
      {a: void 0, b: 2, c: void 0},
      {a: 2, b: void 0, c: 3}
    ]);
    assert.notEqual(data, dataPrepped);
  });

});


// Integration Tests
describe('Integration Tests', function() {
  var runner = require('./integration')(this);
});
