const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const { isSQLite } = require('../../../util/db-helpers');
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

        it('Expect to read transactions when read uncommited', async () => {
          if (isSQLite(knex)) {
            return this.skip();
          }
          await knex
            .transaction(async (trx) => {
              await trx(tableName).insert({ id: 1, value: 1 });
              const result = await knex(tableName).select();
              expect(result.length).to.equal(1);
            })
            .setIsolationLevel('read uncommited');
        });

        it('Expect to not read transactions when read commited', async () => {
          await knex
            .transaction(async (trx) => {
              await trx(tableName).insert({ id: 1, value: 1 });
              const result = await knex(tableName).select();
              expect(result.length).to.equal(0);
            })
            .setIsolationLevel('read commited');
        });

        it('Expect to not read transactions when read commited alternative syntax', async () => {
          const trx = await knex
            .transaction()
            .setIsolationLevel('read commited');
          await trx(tableName).insert({ id: 1, value: 1 });
          const result = await knex(tableName).select();
          await trx.commit();
          expect(result.length).to.equal(0);
        });
      });
    });
  });
});
