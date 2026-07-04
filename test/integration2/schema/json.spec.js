const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('json columns', () => {
    getAllDbs()
      // no support for json in mssql and oracledb, omit test
      .filter(
        (db) => !['mssql', 'oracledb', 'sqlite3', 'better-sqlite3'].includes(db)
      )
      .forEach((db) => {
        describe(db, () => {
          let knex;
          const tblName = 'table_with_json_col1';
          const colName = 'json_col1';

          before(async () => {
            knex = getKnexForDb(db);
            await knex.schema.dropTableIfExists(tblName);
            await knex.schema.createTable(tblName, (table) => {
              table.json(colName);
            });
          });

          after(async () => {
            await knex.schema.dropTable(tblName);
            return knex.destroy();
          });

          it('JSON data is correctly serialized and deserialized', async () => {
            const data = {
              name: 'Jimi',
            };

            await knex(tblName).insert({
              [colName]: data,
            });

            const jsonValue = await knex(tblName).select().from(tblName);

            expect(jsonValue).to.deep.eq([{ json_col1: { name: 'Jimi' } }]);
          });
        });
      });
  });
});
