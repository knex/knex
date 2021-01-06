const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('customType', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const tblName = 'table_with_custom_varchar1';
        const colName = 'varchar_col1';

        before(async () => {
          knex = getKnexForDb(db);
          await knex.schema.dropTableIfExists(tblName);
          await knex.schema.createTable(tblName, (table) => {
            table.specificType(colName, 'varchar(42)');
          });
        });

        after(async () => {
          await knex.schema.dropTable(tblName);
          return knex.destroy();
        });

        it('Allows to specify custom type params', async () => {
          let res;
          switch (db) {
            case 'sqlite3':
              res = await knex.schema.raw(`PRAGMA table_info(${tblName})`);
              expect(res.find((c) => c.name === colName).type).to.equal(
                'varchar(42)'
              );
              break;
            case 'postgres':
              res = await knex
                .select(['data_type', 'character_maximum_length'])
                .from('information_schema.columns')
                .where({ table_name: tblName, column_name: colName });
              expect(res[0].data_type).to.equal('character varying');
              expect(res[0].character_maximum_length).to.equal(42);
              break;
            case 'mssql':
            case 'mysql':
            case 'mysql2':
              res = await knex
                .select(['DATA_TYPE', 'CHARACTER_MAXIMUM_LENGTH'])
                .from('INFORMATION_SCHEMA.COLUMNS')
                .where({ table_name: tblName, column_name: colName });
              expect(res[0].DATA_TYPE).to.equal('varchar');
              expect(res[0].CHARACTER_MAXIMUM_LENGTH).to.equal(42);
              break;
          }
        });
      });
    });
  });
});
