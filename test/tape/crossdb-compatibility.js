'use strict';
const tape = require('tape');

/**
 * Collection of tests for making sure that certain features are cross database compatible
 */
module.exports = function(knex) {
  const driverName = knex.client.driverName;

  if (driverName === 'oracledb') {
    // TODO: FIX ORACLE TO WORK THE SAME WAY WITH OTHER DIALECTS IF POSSIBLE
    return;
  }

  tape(driverName + ' - crossdb compatibility: setup test table', function(t) {
    knex.schema
      .dropTableIfExists('test_table')
      .createTable('test_table', function(t) {
        t.integer('id');
        t.string('first');
        t.string('second');
        t.string('third').unique();
        t.unique(['first', 'second']);
      })
      .finally(function() {
        t.end();
      });
  });

  tape(
    driverName +
      ' - crossdb compatibility: table may have multiple nulls in unique constrainted column',
    function(t) {
      t.plan(3);

      knex('test_table')
        .insert([{ third: 'foo' }, { third: 'foo' }])
        .catch((err) => {
          t.assert(true, 'unique constraint prevents adding rows');
          return knex('test_table').insert([
            { first: 'foo2', second: 'bar2' },
            { first: 'foo2', second: 'bar2' },
          ]);
        })
        .catch((err) => {
          t.assert(true, 'two column unique constraint prevents adding rows');

          // even one null makes index to not match, thus allows adding the row
          return knex('test_table').insert([
            { first: 'fo', second: null, third: null },
            { first: 'fo', second: null, third: null },
            { first: null, second: 'fo', third: null },
            { first: null, second: 'fo', third: null },
            { first: null, second: null, third: null },
          ]);
        })
        .then(() => {
          return knex('test_table');
        })
        .then((res) => {
          t.assert(
            res.length == 5,
            'multiple rows with nulls could be added despite of unique constraints'
          );
        })
        .finally(() => {
          t.end();
        });
    }
  );

  tape(
    driverName + ' - create and drop index works in different cases',
    (t) => {
      t.plan(1);
      knex.schema
        .dropTableIfExists('test_table_drop_unique')
        .createTable('test_table_drop_unique', (t) => {
          t.integer('id');
          t.string('first');
          t.string('second');
          t.string('third').unique();
          t.string('fourth');
          t.unique(['first', 'second']);
          t.unique('fourth');
        })
        .alterTable('test_table_drop_unique', (t) => {
          t.dropUnique('third');
          t.dropUnique('fourth');
          t.dropUnique(['first', 'second']);
        })
        .alterTable('test_table_drop_unique', (t) => {
          t.unique(['first', 'second']);
          t.unique('third');
          t.unique('fourth');
        })
        .then(() => {
          t.assert(
            true,
            'Creating / dropping / creating unique constraint was a success'
          );
        })
        .finally(() => {
          t.end();
        });
    }
  );
};
