const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const { isPostgreSQL, isMysql } = require('../../../util/db-helpers');

describe('Insert', () => {
  describe('onConflict merge', () => {
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
          await knex.schema.createTable('merge_table', (table) => {
            table.integer('id').primary().notNull();
            table.integer('value').notNull();
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable('merge_table');
        });

        it('inserts large amount of entries correctly', async function () {
          if (!isMysql(knex) && !isPostgreSQL(knex)) {
            return this.skip();
          }

          const rows = [];
          // There seems to be a 32-bit limit for amount of values passed in pg (https://github.com/brianc/node-postgres/issues/581)
          // Cannot go any higher with bindings currently
          for (let i = 0; i < 32767; i++) {
            rows.push({ id: i, value: i });
          }
          await knex.table('merge_table').insert(rows).onConflict('id').merge();
        });

        it('inserts large amount of entries correctly (raw)', async function () {
          if (!isPostgreSQL(knex)) {
            return this.skip();
          }

          const rows = [];
          for (let i = 0; i < 32768; i++) {
            rows.push({ id: i, value: i });
          }
          await knex.raw(
            knex.table('merge_table').insert(rows).toQuery() +
              ' ON CONFLICT (id) DO UPDATE SET ' +
              Object.keys(rows[0])
                .map((field) => `${field}=EXCLUDED.${field}`)
                .join(', ')
          );
        });
      });
    });
  });
});
