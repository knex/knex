/*global describe*/

'use strict';

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
global.d = new Date();

Promise.longStackTraces();

var knex = require('../knex');

var clients = {
  maria: {
    knex: knex({client: 'maria'}),
    alias: 'mysql'
  },
  mysql: {
    knex: knex({client: 'mysql'}),
  },
  sqlite3: {
    knex: knex({client: 'sqlite3'})
  },
  postgres: {
    knex: knex({client: 'postgres'}),
  },
  oracle: {
    knex: knex({client: 'oracle'}),
  }
};

describe('Unit tests', function() {
  Object.keys(clients).forEach(function (clientName) {
    var current = clients[clientName];
    require('./unit/schema/' + (current.alias || clientName))(current.knex.client);
    require('./unit/query/builder')(function () { return new current.knex.client.QueryBuilder(); }, clientName, current.alias, current.knex);
  });
});

// Integration Tests
describe('Integration Tests', function() {
  require('./integration')(this);
});
