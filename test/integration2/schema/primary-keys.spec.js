const { expect } = require('chai');
const { isMssql, isSQLite, isPostgreSQL } = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('Primary keys', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;

        before(function () {
          knex = getKnexForDb(db);
          if (isMssql(knex)) {
            return this.skip();
          }
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable('primary_table', (table) => {
            table.integer('id_one');
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
              if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_four`) values (1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_four'
                );
              }
              if (isPostgreSQL(knex)) {
                expect(err.message).to.equal(
                  'insert into "primary_table" ("id_four") values ($1) - duplicate key value violates unique constraint "primary_table_pkey"'
                );
              }
            }
          });

          it('creates a primary key with a custom constraint name', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.integer('id_four').primary('my_custom_constraint_name');
            });

            await knex('primary_table').insert({ id_four: 1 });
            try {
              await knex('primary_table').insert({ id_four: 1 });
              throw new Error(`Shouldn't reach this`);
            } catch (err) {
              if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_four`) values (1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_four'
                );
              }
              if (isPostgreSQL(knex)) {
                expect(err.message).to.equal(
                  'insert into "primary_table" ("id_four") values ($1) - duplicate key value violates unique constraint "my_custom_constraint_name"'
                );
              }
            }

            await knex.schema.alterTable('primary_table', (table) => {
              table.dropPrimary('my_custom_constraint_name');
            });

            await knex('primary_table').insert({ id_four: 1 });
          });

          it('creates a compound primary key', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.primary(['id_two', 'id_three']);
            });

            await knex('primary_table').insert({ id_two: 1, id_three: 1 });
            await knex('primary_table').insert({ id_two: 2, id_three: 1 });
            await knex('primary_table').insert({ id_two: 1, id_three: 2 });

            try {
              await knex('primary_table').insert({ id_two: 1, id_three: 1 });
            } catch (err) {
              if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_three`, `id_two`) values (1, 1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_two, primary_table.id_three'
                );
              }
              if (isPostgreSQL(knex)) {
                expect(err.message).to.equal(
                  'insert into "primary_table" ("id_three", "id_two") values ($1, $2) - duplicate key value violates unique constraint "primary_table_pkey"'
                );
              }
            }
          });

          it('creates a compound primary key with a custom constraint name', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.primary(
                ['id_two', 'id_three'],
                'my_custom_constraint_name'
              );
            });

            await knex('primary_table').insert({ id_two: 1, id_three: 1 });
            await knex('primary_table').insert({ id_two: 2, id_three: 1 });
            await knex('primary_table').insert({ id_two: 1, id_three: 2 });

            try {
              await knex('primary_table').insert({ id_two: 1, id_three: 1 });
            } catch (err) {
              if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_three`, `id_two`) values (1, 1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_two, primary_table.id_three'
                );
              }
              if (isPostgreSQL(knex)) {
                expect(err.message).to.equal(
                  'insert into "primary_table" ("id_three", "id_two") values ($1, $2) - duplicate key value violates unique constraint "my_custom_constraint_name"'
                );
              }
            }

            await knex.schema.alterTable('primary_table', (table) => {
              table.dropPrimary('my_custom_constraint_name');
            });

            await knex('primary_table').insert({ id_two: 1, id_three: 1 });
          });
        });
      });
    });
  });
});
