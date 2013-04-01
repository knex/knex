var Knex = require('../knex');
var Q = require('q');

var assert = require('assert');
var equal = assert.equal;
var deepEqual = assert.deepEqual;

describe('Knex.SchemaBuilder', function() {

  it('creates new tables', function(ok) {
    Knex.Schema.createTable('table', function(table) {
      table.increments('id');
      table.string('first_name').nullable();
      table.string('last_name');
      table.integer('logins').defaultTo(1).index();
      table.text('about').defaultTo('My Bio.');
      table.timestamps();
    }).then(function() {
      ok();
    }).done();
  });

});