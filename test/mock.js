var assert = require('assert');
var Knex   = require('../knex');
var Q      = require('q');
var _      = require('underscore');

Knex.Initialize({
  client: 'mysql',
  connection: {}
});

originalQuery = Knex.client.query;

Knex.client.query = function(data, connection) {
  return Q.resolve([data.sql, data.bindings, connection]);
};

describe('Knex', function() {

});

// Standard query tests
require('./schemabuilder');
require('./builder');