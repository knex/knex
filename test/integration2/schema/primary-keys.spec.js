const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe.skip('Primary keys', () => {
    // @TODO remove .skip when done
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;

        before(() => {
          knex = getKnexForDb(db);
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable('primary_table', (table) => {
            table.integer('id_one').primary();
            table.integer('id_two');
            table.integer('id_three');
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable('primary_table');
        });

        describe('createPrimaryKey', () => {
          it('creates a new primary key', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.integer('id_four').primary();
            });

            await knex('primary_table').insert({ id_four: 1 });

            try {
              await knex('primary_table').insert({ id_four: 1 });
              throw new Error(`Shouldn't reach this`);
            } catch (err) {
              console.log(err);
              expect(true).to.be(true);
            }
          });

          it('creates a primary key with a custom constraint name', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.integer('id_four').primary('my_custom_constraint_name');
            });

            // @TODO Expect it to work.
          });

          it('creates a compound primary key', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.primary(['id_two', 'id_three']);
            });

            // @TODO Expect it to work.
          });

          it('creates a compound primary key with a custom constraint name', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.primary(
                ['id_two', 'id_three'],
                'my_custom_constraint_name'
              );
            });

            // @TODO Expect it to work.
          });
        });
      });
    });
  });
});
