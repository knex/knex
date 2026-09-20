const { expect } = require('chai');
const { isSQLite } = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('quoted table names with dots (#2762)', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const table = '"my.table.name"';

        before(() => {
          knex = getKnexForDb(db);
        });

        after(async () => {
          if (isSQLite(knex)) {
            await knex.schema.dropTableIfExists(table);
          }
          return knex.destroy();
        });

        it('creates and queries a quoted sqlite table name containing dots', async function () {
          if (!isSQLite(knex)) {
            return this.skip();
          }

          await knex.schema.dropTableIfExists(table);
          await knex.schema.createTable(table, (t) => {
            t.integer('id');
            t.text('data');
          });

          await knex(table).insert({ id: 1, data: 'ok' });
          const rows = await knex(table).select('id', 'data');
          expect(rows).to.deep.equal([{ id: 1, data: 'ok' }]);

          const exists = await knex.schema.hasTable(table);
          expect(exists).to.equal(true);
        });
      });
    });
  });
});
