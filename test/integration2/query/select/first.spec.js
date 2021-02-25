const { expect } = require('chai');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
require('../../../util/chai-setup');

describe('First', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      const tblName = 'test_table';
      const colName = 'test_col';
      const col2Name = 'test_col2';
      const col3Name = 'test_col3';

      before(async () => {
        knex = getKnexForDb(db);
        await knex.schema.dropTableIfExists(tblName);
        await knex.schema.createTable(tblName, (table) => {
          table.string(colName);
          table.string(col2Name);
          table.string(col3Name);
        });
        await knex(tblName).insert({
          [colName]: '1',
          [col2Name]: '2',
          [col3Name]: '3',
        });
      });

      after(async () => {
        await knex.schema.dropTable(tblName);
        return knex.destroy();
      });

      it('Works correctly with array param', async () => {
        const result = await knex(tblName).first([colName, col2Name]);
        expect(result).to.deep.equal({ test_col: '1', test_col2: '2' });
      });
    });
  });
});
