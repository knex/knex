const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

async function fetchDefaultConstraintName(knex, table, column) {
  const [result] = await knex.schema.raw(`
    SELECT default_constraints.name
    FROM sys.all_columns
    INNER JOIN sys.tables
        ON all_columns.object_id = tables.object_id
    INNER JOIN sys.schemas
        ON tables.schema_id = schemas.schema_id
    INNER JOIN sys.default_constraints
        ON all_columns.default_object_id = default_constraints.object_id
    WHERE schemas.name = 'dbo'
      AND tables.name = '${table}'
      AND all_columns.name = '${column}'
  `);
  return result ? result.name : null;
}

describe('MSSQL dialect', () => {
  describe('Connection configuration', () => {
    getAllDbs()
      .filter((db) => db.startsWith('mssql'))
      .forEach((db) => {
        describe(db, () => {
          let knex;
          before(async () => {
            knex = getKnexForDb(db);
          });

          beforeEach(async () => {
            await knex.schema.createTable('test', function () {
              this.increments('id').primary();
            });
          });

          after(async () => {
            await knex.destroy();
          });

          afterEach(async () => {
            await knex.schema.dropTable('test');
          });

          it('names default constraint', async () => {
            await knex.schema.alterTable('test', function () {
              this.string('name').defaultTo('knex');
            });
            const result = await fetchDefaultConstraintName(
              knex,
              'test',
              'name'
            );
            expect(result).to.equal('test_name_default');
          });
          it('names default constraint with supplied name', async () => {
            const constraintName = 'DF_test_name';
            await knex.schema.alterTable('test', function () {
              this.string('name').defaultTo('knex', { constraintName });
            });
            const result = await fetchDefaultConstraintName(
              knex,
              'test',
              'name'
            );
            expect(result).to.equal('DF_test_name');
          });
          it("doesn't name default constraint", async () => {
            const constraintName = '';
            await knex.schema.alterTable('test', function () {
              this.string('name').defaultTo('knex', { constraintName });
            });
            const result = await fetchDefaultConstraintName(
              knex,
              'test',
              'name'
            );
            // this is the default patten used by mssql if no constraint is defined
            expect(result).to.match(/^DF__test__name__[0-9A-Z]+$/);
          });
        });
      });
  });
});
