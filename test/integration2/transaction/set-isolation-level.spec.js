const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const { isSQLite, isPostgreSQL } = require('../../util/db-helpers');
const { expect } = require('chai');

describe('Transaction', () => {
  describe('setIsolationLevel', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const tableName = 'key_value';
        before(() => {
          knex = getKnexForDb(db);
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable(tableName, (table) => {
            table.integer('id').primary().notNull();
            table.integer('value').notNull();
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable(tableName);
        });

        it('Expect read skew when read committed', async () => {
          // SQLite is always Serializable
          if (isSQLite(knex)) {
            return;
          }
          const trx = await knex
            .transaction()
            .setIsolationLevel('read committed');
          const result1 = await trx(tableName).select();
          await knex(tableName).insert({ id: 1, value: 1 });
          const result2 = await trx(tableName).select();
          await trx.commit();
          expect(result1).to.not.equal(result2);
        });

        it('Expect to avoid read skew when repeatable read (snapshot isolation)', async () => {
          if (isSQLite(knex)) {
            return;
          }
          const trx = await knex
            .transaction()
            .setIsolationLevel('repeatable read');
          const result1 = await trx(tableName).select();
          await knex(tableName).insert({ id: 1, value: 1 });
          const result2 = await trx(tableName).select();
          await trx.commit();
          expect(result1).to.deep.equal(result2);
        });
      });
    });
  });
});
