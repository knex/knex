'use strict';

const { isOracle, isMysql } = require('../util/db-helpers');
const {
  getAllDbs,
  getKnexForDb,
} = require('../integration2/util/knex-instance-provider');

getAllDbs().forEach((db) => {
  describe(`${db} - crossdb compatibility`, () => {
    let knex;

    beforeAll(() => {
      knex = getKnexForDb(db);
    });

    afterAll(() => knex.destroy());

    // TODO: FIX ORACLE TO WORK THE SAME WAY WITH OTHER DIALECTS IF POSSIBLE
    beforeAll(async () => {
      if (isOracle(knex)) {
        return;
      }

      await knex.schema
        .dropTableIfExists('test_table')
        .createTable('test_table', function (t) {
          t.integer('id');
          t.string('first');
          t.string('second');
          t.string('third').unique();
          t.unique(['first', 'second']);
        });
    });

    afterAll(async () => {
      if (!isOracle(knex)) {
        await knex.schema.dropTableIfExists('test_table');
        await knex.schema.dropTableIfExists('test_table_drop_unique');
        await knex.schema.dropTableIfExists('test_table_drop_unique_if_exists');
      }
    });

    it('table may have multiple nulls in unique constrainted column', async () => {
      if (isOracle(knex)) {
        return;
      }

      await expect(
        knex('test_table').insert([{ third: 'foo' }, { third: 'foo' }])
      ).rejects.toBeTruthy();

      await expect(
        knex('test_table').insert([
          { first: 'foo2', second: 'bar2' },
          { first: 'foo2', second: 'bar2' },
        ])
      ).rejects.toBeTruthy();

      // even one null makes index to not match, thus allows adding the row
      await knex('test_table').insert([
        { first: 'fo', second: null, third: null },
        { first: 'fo', second: null, third: null },
        { first: null, second: 'fo', third: null },
        { first: null, second: 'fo', third: null },
        { first: null, second: null, third: null },
      ]);

      const res = await knex('test_table');
      expect(res.length).toBe(5);

      // clean up for next tests
      await knex('test_table').truncate();
    });

    it('create and drop index works in different cases', async () => {
      if (isOracle(knex)) {
        return;
      }

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

      expect(true).toBe(true);
    });

    it('create and drop index works in different cases, with dropUniqueIfExists', async () => {
      if (isOracle(knex)) {
        return;
      }

      if (isMysql(knex) || isOracle(knex)) {
        // dropUniqueIfExists not supported on mysql/oracle
        return;
      }

      await knex.schema
        .dropTableIfExists('test_table_drop_unique_if_exists')
        .createTable('test_table_drop_unique_if_exists', (t) => {
          t.integer('id');
          t.string('first');
          t.string('second');
          t.string('third').unique();
          t.string('fourth');
          t.unique(['first', 'second']);
          t.unique('fourth');
        })
        .alterTable('test_table_drop_unique_if_exists', (t) => {
          t.dropUniqueIfExists('third');
          t.dropUniqueIfExists('fourth');
          t.dropUniqueIfExists(['first', 'second']);
          t.dropUniqueIfExists('foo');
        })
        .alterTable('test_table_drop_unique_if_exists', (t) => {
          t.unique(['first', 'second']);
          t.unique('third');
          t.unique('fourth');
        });

      expect(true).toBe(true);
    });
  });
});
