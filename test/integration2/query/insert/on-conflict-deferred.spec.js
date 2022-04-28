const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const { isPostgreSQL } = require('../../../util/db-helpers');

describe('Insert', () => {
  describe('onConflict deferred', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        before(function () {
          knex = getKnexForDb(db);
          if (!isPostgreSQL(knex)) {
            this.skip('This test is PostgreSQL only');
          }
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable('table_a', (table) => {
            table.integer('id').primary().notNull();
            table.integer('b_id').notNull();
            table.integer('value').notNull();
          });
          await knex.schema.createTable('table_b', (table) => {
            table.integer('id').primary().notNull();
            table.integer('a_id').notNull();
            table.integer('value').notNull();
          });
          await knex.schema.table('table_a', (table) => {
            table
              .foreign('b_id')
              .references('table_b.id')
              .onDelete('cascade')
              .onUpdate('cascade')
              .deferrable('deferred');
          });
          await knex.schema.table('table_b', (table) => {
            table
              .foreign('a_id')
              .references('table_a.id')
              .onDelete('cascade')
              .onUpdate('cascade')
              .deferrable('deferred');
          });
        });

        afterEach(async () => {
          await knex.schema.raw('drop table table_a cascade');
          await knex.schema.raw('drop table table_b cascade');
        });

        it('inserts entries with delayed checks correctly', async function () {
          for (let i = 0; i < 10; i++) {
            await knex.transaction(async function (txn) {
              await txn
                .table('table_a')
                .insert({ id: i, b_id: i, value: i })
                .onConflict('id')
                .merge();
              await txn
                .table('table_b')
                .insert({ id: i, a_id: i, value: i })
                .onConflict('id')
                .merge();
            });
          }
        });
      });
    });
  });
});
