const { expect } = require('chai');
const {
  Db,
  getAllDbs,
  getKnexForDb,
} = require('../util/knex-instance-provider');

const QUERY_TABLE_ONE_INDICES =
  'SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type="index" AND tbl_name="index_table_one"';
const QUERY_TABLE_TWO_INDICES =
  'SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type="index" AND tbl_name="index_table_two"';

describe('Schema', () => {
  describe('Index', () => {
    getAllDbs()
      .filter((db) => db === Db.SQLite)
      .forEach((db) => {
        describe(db, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db);
          });

          after(() => {
            return knex.destroy();
          });

          beforeEach(async () => {
            await knex.schema
              .createTable('index_table_one', (table) => {
                table.string('id').primary();
                table
                  .integer('id_three')
                  .unsigned()
                  .notNullable()
                  .references('id')
                  .inTable('index_table_three');

                table.integer('column_one');
                table.integer('column_two');
                table.integer('column_three');
                table.integer('column_four');

                table.index('column_one');
                table.index('column_two');
                table.index(['column_two', 'column_three']);
              })
              .createTable('index_table_two', (table) => {
                table.string('no_id');
                table.integer('no_id_three').unsigned().notNullable();

                table.integer('column_one');
                table.integer('column_two');
                table.integer('column_three');
                table.integer('column_four');

                table.unique('column_one');
                table.unique('column_two');
                table.unique(['column_two', 'column_three']);
              })
              .createTable('index_table_three', (table) => {
                table.increments().primary();
              });

            await knex('index_table_three').insert({});
            await knex('index_table_one').insert([
              {
                id: 'one',
                id_three: 1,
                column_one: 1,
                column_two: 1,
                column_three: 1,
                column_four: 3,
              },
              {
                id: 'two',
                id_three: 1,
                column_one: 1,
                column_two: 1,
                column_three: 1,
                column_four: 4,
              },
            ]);
            await knex('index_table_two').insert([
              {
                no_id: 'one',
                no_id_three: 1,
                column_one: 1,
                column_two: 1,
                column_three: 1,
                column_four: 3,
              },
              {
                no_id: 'two',
                no_id_three: 1,
                column_one: 2,
                column_two: 2,
                column_three: 2,
                column_four: 4,
              },
            ]);
          });

          afterEach(async () => {
            await knex.schema
              .dropTable('index_table_one')
              .dropTable('index_table_two')
              .dropTable('index_table_three');
          });

          describe('dropColumn', () => {
            it('recreates indices after dropping a column without an index', async () => {
              const indicesOneBefore = await knex.raw(QUERY_TABLE_ONE_INDICES);
              const indicesTwoBefore = await knex.raw(QUERY_TABLE_TWO_INDICES);

              await knex.schema.alterTable('index_table_one', (table) => {
                table.dropColumn('column_four');
              });
              await knex.schema.alterTable('index_table_two', (table) => {
                table.dropColumn('column_four');
              });

              const indicesOneAfter = await knex.raw(QUERY_TABLE_ONE_INDICES);
              const indicesTwoAfter = await knex.raw(QUERY_TABLE_TWO_INDICES);

              expect(indicesOneAfter).to.deep.have.same.members(
                indicesOneBefore
              );
              expect(indicesTwoAfter).to.deep.have.same.members(
                indicesTwoBefore
              );
            });

            it('drops indices when the corresponding column is dropped', async () => {
              const indicesOneBefore = await knex.raw(QUERY_TABLE_ONE_INDICES);
              const indicesTwoBefore = await knex.raw(QUERY_TABLE_TWO_INDICES);
              const indicesOneBeforeWithoutIndex = indicesOneBefore.filter(
                (index) => index.name !== 'index_table_one_column_one_index'
              );
              const indicesTwoBeforeWithoutIndex = indicesTwoBefore.filter(
                (index) => index.name !== 'index_table_two_column_one_unique'
              );

              await knex.schema.alterTable('index_table_one', (table) => {
                table.dropColumn('column_one');
              });
              await knex.schema.alterTable('index_table_two', (table) => {
                table.dropColumn('column_one');
              });

              const indicesOneAfter = await knex.raw(QUERY_TABLE_ONE_INDICES);
              const indicesTwoAfter = await knex.raw(QUERY_TABLE_TWO_INDICES);

              expect(indicesOneAfter).to.deep.have.same.members(
                indicesOneBeforeWithoutIndex
              );
              expect(indicesTwoAfter).to.deep.have.same.members(
                indicesTwoBeforeWithoutIndex
              );
            });

            it('alters composite indices when one of the corresponding columns is dropped', async () => {
              const indicesOneBeforeWithoutIndex = [
                {
                  type: 'index',
                  name: 'sqlite_autoindex_index_table_one_1',
                  tbl_name: 'index_table_one',
                  sql: null,
                },
                {
                  type: 'index',
                  name: 'index_table_one_column_one_index',
                  tbl_name: 'index_table_one',
                  sql:
                    'CREATE INDEX `index_table_one_column_one_index` on `index_table_one` (`column_one`)',
                },
                {
                  type: 'index',
                  name: 'index_table_one_column_two_column_three_index',
                  tbl_name: 'index_table_one',
                  sql:
                    'CREATE INDEX `index_table_one_column_two_column_three_index` on `index_table_one` (`column_three`)',
                },
              ];
              const indicesTwoBeforeWithoutIndex = [
                {
                  type: 'index',
                  name: 'index_table_two_column_one_unique',
                  tbl_name: 'index_table_two',
                  sql:
                    'CREATE UNIQUE INDEX `index_table_two_column_one_unique` on `index_table_two` (`column_one`)',
                },
                {
                  type: 'index',
                  name: 'index_table_two_column_two_column_three_unique',
                  tbl_name: 'index_table_two',
                  sql:
                    'CREATE UNIQUE INDEX `index_table_two_column_two_column_three_unique` on `index_table_two` (`column_three`)',
                },
              ];

              await knex.schema.alterTable('index_table_one', (table) => {
                table.dropColumn('column_two');
              });
              await knex.schema.alterTable('index_table_two', (table) => {
                table.dropColumn('column_two');
              });

              const indicesOneAfter = await knex.raw(QUERY_TABLE_ONE_INDICES);
              const indicesTwoAfter = await knex.raw(QUERY_TABLE_TWO_INDICES);

              expect(indicesOneAfter).to.deep.have.same.members(
                indicesOneBeforeWithoutIndex
              );
              expect(indicesTwoAfter).to.deep.have.same.members(
                indicesTwoBeforeWithoutIndex
              );
            });
          });

          describe('alterColumns', () => {
            it('recreates indices after altering a column', async () => {
              const indicesBefore = await knex.raw(QUERY_TABLE_ONE_INDICES);

              await knex.schema.alterTable('index_table_one', (table) => {
                table.string('column_one').alter();
              });

              const indicesAfter = await knex.raw(QUERY_TABLE_ONE_INDICES);

              expect(indicesAfter).to.deep.have.same.members(indicesBefore);
            });
          });

          describe('dropForeign', () => {
            it('recreates indices after dropping a foreign key', async () => {
              const indicesBefore = await knex.raw(QUERY_TABLE_ONE_INDICES);

              await knex.schema.alterTable('index_table_one', (table) => {
                table.dropForeign('id_three');
              });

              const indicesAfter = await knex.raw(QUERY_TABLE_ONE_INDICES);

              expect(indicesAfter).to.deep.have.same.members(indicesBefore);
            });
          });

          describe('dropPrimary', () => {
            it('recreates indices after dropping a primary key', async () => {
              const indicesBefore = await knex.raw(QUERY_TABLE_ONE_INDICES);
              const indicesBeforeWithoutPrimary = indicesBefore.filter(
                (index) => index.sql !== null
              );

              await knex.schema.alterTable('index_table_one', (table) => {
                table.dropPrimary('id');
              });

              const indicesAfter = await knex.raw(QUERY_TABLE_ONE_INDICES);

              expect(indicesAfter).to.deep.have.same.members(
                indicesBeforeWithoutPrimary
              );
            });
          });

          describe('foreign', () => {
            it('recreates indices after adding a foreign key', async () => {
              const indicesBefore = await knex.raw(QUERY_TABLE_TWO_INDICES);

              await knex.schema.alterTable('index_table_two', (table) => {
                table
                  .foreign('no_id_three')
                  .references('id')
                  .inTable('index_table_three');
              });

              const indicesAfter = await knex.raw(QUERY_TABLE_TWO_INDICES);

              expect(indicesAfter).to.deep.have.same.members(indicesBefore);
            });
          });

          describe('primary', () => {
            it('recreates indices after adding a primary key', async () => {
              const indicesBefore = await knex.raw(QUERY_TABLE_TWO_INDICES);

              await knex.schema.alterTable('index_table_two', (table) => {
                table.primary('no_id');
              });

              const indicesAfter = await knex.raw(QUERY_TABLE_TWO_INDICES);
              const indicesAfterWithoutPrimary = indicesAfter.filter(
                (index) => index.sql !== null
              );

              expect(indicesAfterWithoutPrimary).to.deep.have.same.members(
                indicesBefore
              );
            });
          });
        });
      });
  });
});
