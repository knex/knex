var assert = require('assert');
var Knex   = require('../knex');
var Q      = require('q');
var _      = require('underscore');

Knex.Initialize({
  client: 'mysql'
});

originalQuery = Knex.client.query;
Knex.client.query = function(querystring, bindings, callback, connection) {
  return callback(null, [querystring, bindings, connection]);
};

describe('Knex', function() {

});

// Standard query tests
require('./schemabuilder');
require('./builder');