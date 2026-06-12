const { expect } = require('chai');
const {
  isMssql,
  isSQLite,
  isPgBased,
  isCockroachDB,
  isBetterSQLite3,
} = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('Primary keys', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;

        before(function () {
          knex = getKnexForDb(db);
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
          await knex.schema.dropTableIfExists('primary_table');
        });

        describe('createPrimaryKey', () => {
          it('creates a new primary key', async () => {
            await knex.schema.alterTable('primary_table', (table) => {
              table.integer('id_four').notNull().primary();
            });

            await knex('primary_table').insert({ id_four: 1 });

            try {
              await knex('primary_table').insert({ id_four: 1 });
              throw new Error(`Shouldn't reach this`);
            } catch (err) {
              if (isBetterSQLite3(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_four`) values (1) - UNIQUE constraint failed: primary_table.id_four'
                );
              } else if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_four`) values (1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_four'
                );
              }
              if (isPgBased(knex)) {
                expect(err.message).to.equal(
                  'insert into "primary_table" ("id_four") values ($1) - duplicate key value violates unique constraint "primary_table_pkey"'
                );
              }
            }
          });

          it('create multiple primary keys with increments on same column', async function () {
            await knex.schema.dropTableIfExists('table_multiple_keys');
            await knex.schema.createTable('table_multiple_keys', function (t) {
              t.primary(['id', 'second_id', 'other_col']);
              t.string('second_id', 16).notNullable();
              t.integer('other_col').notNullable();
              t.increments('id');
            });
            await knex('table_multiple_keys').insert([
              {
                second_id: 'abc',
                other_col: 2,
              },
              {
                second_id: 'abc',
                other_col: 3,
              },
            ]);
            expect(() => {
              knex('table_multiple_keys').insert([
                {
                  id: 1,
                  second_id: 'abc',
                  other_col: 2,
                },
              ]);
            }).to.throw;
            // It's always ok, the primary key is on three columns.
            await knex('table_multiple_keys').insert([
              {
                second_id: 'abc',
                other_col: 2,
              },
              {
                second_id: 'abc',
                other_col: 3,
              },
            ]);
            expect(() => {
              knex('table_multiple_keys').insert([
                {
                  id: 4,
                  second_id: 'abc',
                  other_col: 3,
                },
              ]);
            }).to.throw;
          });

          it('create multiple primary keys with increments on other columns', async function () {
            await knex.schema.dropTableIfExists('table_multiple_keys');
            await knex.schema.createTable('table_multiple_keys', function (t) {
              t.primary(['second_id', 'other_col']);
              t.string('second_id', 16).notNullable();
              t.integer('other_col').notNullable();
              t.increments('id');
            });
            await knex('table_multiple_keys').insert([
              {
                second_id: 'abc',
                other_col: 2,
              },
              {
                second_id: 'abc',
                other_col: 3,
              },
            ]);
            expect(() => {
              knex('table_multiple_keys').insert([
                {
                  second_id: 'abc',
                  other_col: 2,
                },
              ]);
            }).to.throw;
            // It's always ok, the primary key is on three columns.
            await knex('table_multiple_keys').insert([
              {
                second_id: 'bcd',
                other_col: 2,
              },
              {
                second_id: 'abc',
                other_col: 4,
              },
            ]);
            expect(() => {
              knex('table_multiple_keys').insert([
                {
                  id: 4,
                  second_id: 'abc',
                  other_col: 3,
                },
              ]);
            }).to.throw;
          });

          it('creates a primary key with a custom constraint name', async function () {
            // CockroachDB 21.1 throws "(72): unimplemented: primary key dropped without subsequent addition of new primary key in same transaction"
            if (isCockroachDB(knex)) {
              return this.skip();
            }

            await knex.schema.alterTable('primary_table', (table) => {
              table
                .integer('id_four')
                .notNull()
                .primary('my_custom_constraint_name');
            });

            await knex('primary_table').insert({ id_four: 1 });
            try {
              await knex('primary_table').insert({ id_four: 1 });
              throw new Error(`Shouldn't reach this`);
            } catch (err) {
              if (isBetterSQLite3(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_four`) values (1) - UNIQUE constraint failed: primary_table.id_four'
                );
              } else if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_four`) values (1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_four'
                );
              }
              if (isPgBased(knex)) {
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
              // CockroachDB and mssql do not support nullable primary keys
              if (isCockroachDB(knex) || isMssql(knex)) {
                table.dropNullable('id_two');
                table.dropNullable('id_three');
              }
              table.primary(['id_two', 'id_three']);
            });

            await knex('primary_table').insert({ id_two: 1, id_three: 1 });
            await knex('primary_table').insert({ id_two: 2, id_three: 1 });
            await knex('primary_table').insert({ id_two: 1, id_three: 2 });

            try {
              await knex('primary_table').insert({ id_two: 1, id_three: 1 });
            } catch (err) {
              if (isBetterSQLite3(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_three`, `id_two`) values (1, 1) - UNIQUE constraint failed: primary_table.id_two, primary_table.id_three'
                );
              } else if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  'insert into `primary_table` (`id_three`, `id_two`) values (1, 1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_two, primary_table.id_three'
                );
              }
              if (isPgBased(knex)) {
                expect(err.message).to.equal(
                  'insert into "primary_table" ("id_three", "id_two") values ($1, $2) - duplicate key value violates unique constraint "primary_table_pkey"'
                );
              }
            }
          });

          for (const [flavor, customConstraintName] of [
            ['provided directly as a string', 'my_custom_constraint_name'],
            [
              'provided in the options object',
              { constraintName: 'my_custom_constraint_name' },
            ],
          ]) {
            it(`creates a compound primary key with a custom constraint name ${flavor}`, async function () {
              // As of 2021-10-02, CockroachDB does not support dropping a primary key without creating a new one in the same transaction.
              if (isCockroachDB(knex)) {
                return this.skip();
              }

              await knex.schema.alterTable('primary_table', (table) => {
                // CockroachDB and mssql do not support nullable primary keys
                if (isCockroachDB(knex) || isMssql(knex)) {
                  table.dropNullable('id_two');
                  table.dropNullable('id_three');
                }
                table.primary(['id_two', 'id_three'], customConstraintName);
              });

              await knex('primary_table').insert({ id_two: 1, id_three: 1 });
              await knex('primary_table').insert({ id_two: 2, id_three: 1 });
              await knex('primary_table').insert({ id_two: 1, id_three: 2 });

              try {
                await knex('primary_table').insert({ id_two: 1, id_three: 1 });
              } catch (err) {
                if (isBetterSQLite3(knex)) {
                  expect(err.message).to.equal(
                    'insert into `primary_table` (`id_three`, `id_two`) values (1, 1) - UNIQUE constraint failed: primary_table.id_two, primary_table.id_three'
                  );
                } else if (isSQLite(knex)) {
                  expect(err.message).to.equal(
                    'insert into `primary_table` (`id_three`, `id_two`) values (1, 1) - SQLITE_CONSTRAINT: UNIQUE constraint failed: primary_table.id_two, primary_table.id_three'
                  );
                }
                if (isPgBased(knex)) {
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
          }
        });
      });
    });
  });
});
