'use strict';
const tape = require('tape');
const { expect } = require('chai');
const { isOracle } = require('../util/db-helpers');

/**
 * Collection of tests for making sure that certain features are cross database compatible
 */
module.exports = function (knex) {
  const driverName = knex.client.driverName;

  if (isOracle(knex)) {
    // TODO: FIX ORACLE TO WORK THE SAME WAY WITH OTHER DIALECTS IF POSSIBLE
    return;
  }

  tape(
    driverName + ' - crossdb compatibility: setup test table',
    async function (t) {
      try {
        await knex.schema
          .dropTableIfExists('test_table')
          .createTable('test_table', function (t) {
            t.integer('id');
            t.string('first');
            t.string('second');
            t.string('third').unique();
            t.unique(['first', 'second']);
          });
      } finally {
        t.end();
      }
    }
  );

  tape(
    driverName +
      ' - crossdb compatibility: table may have multiple nulls in unique constrainted column',
    async (t) => {
      t.plan(3);

      try {
        await expect(
          knex('test_table').insert([{ third: 'foo' }, { third: 'foo' }])
        ).to.be.eventually.rejected;
        t.assert(true, 'unique constraint prevents adding rows');

        await expect(
          knex('test_table').insert([
            { first: 'foo2', second: 'bar2' },
            { first: 'foo2', second: 'bar2' },
          ])
        ).to.be.eventually.rejected;

        t.assert(true, 'two column unique constraint prevents adding rows');

        // even one null makes index to not match, thus allows adding the row
        await knex('test_table').insert([
          { first: 'fo', second: null, third: null },
          { first: 'fo', second: null, third: null },
          { first: null, second: 'fo', third: null },
          { first: null, second: 'fo', third: null },
          { first: null, second: null, third: null },
        ]);

        const res = await knex('test_table');
        t.assert(
          res.length === 5,
          'multiple rows with nulls could be added despite of unique constraints'
        );
      } finally {
        t.end();
      }
    }
  );

  tape(
    driverName + ' - create and drop index works in different cases',
    async (t) => {
      t.plan(1);
      try {
        await knex.schema
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
          });
        t.assert(
          true,
          'Creating / dropping / creating unique constraint was a success'
        );
      } finally {
        t.end();
      }
    }
  );
};
