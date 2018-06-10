'use strict';
const tape = require('tape')

/**
 * Collection of tests for making sure that certain features are cross database compatible
 */
module.exports = function(knex) {

  const dialect = knex.client.dialect;

  tape(dialect + ' - crossdb compatibility: setup test table', function(t) {
    knex.schema.dropTableIfExists('test_table')
      .createTable('test_table', function(t) {
        t.integer('id');
        t.string('first');
        t.string('second');
        t.string('third').unique();
        t.unique(['first', 'second']);
      })
      .then(function() {
        t.end();
      });
  });

  tape(dialect + ' - crossdb compatibility: table may have multiple nulls in unique constrainted column', function (t) {
    t.plan(3);

    knex('test_table').insert([
      { third: 'foo' }, 
      { third: 'foo' }
    ]).catch(err => {
      t.assert(true, 'unique constraint prevents adding rows');
      return knex('test_table').insert([
        { first: 'foo2', second: 'bar2' }, 
        { first: 'foo2', second: 'bar2' }
      ]);
    }).catch(err => {
      t.assert(true, 'two column unique constraint prevents adding rows');

      // even one null makes index to not match
      return knex('test_table').insert([
        { first: 'fo', second: null, third: null }, 
        { first: 'fo', second: null, third: null },
        { first: null, second: 'fo', third: null },
        { first: null, second: 'fo', third: null },
        { first: null, second: null, third: null },
      ]);
    }).then(() => {
      return knex('test_table');
    }).then(res => {
      t.assert(res.length == 5, 'multiple rows with nulls could be added despite of unique constraints')
      t.end();
    });
  });

}
