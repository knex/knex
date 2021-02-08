const { expect } = require('chai');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
require('../../../util/chai-setup');

describe('Pluck', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      const tblName = 'test_table';
      const colName = 'test_col';

      before(async () => {
        knex = getKnexForDb(db);
        await knex.schema.dropTableIfExists(tblName);
        await knex.schema.createTable(tblName, (table) => {
          table.string(colName);
        });
      });

      after(async () => {
        await knex.schema.dropTable(tblName);
        return knex.destroy();
      });

      it('Throws an error if used before before "first"', async () => {
        expect(() => {
          knex(tblName).pluck(colName).first();
        }).to.throw(Error, 'Cannot chain .first() on "pluck" query');
      });

      it('Throws an error if used before after "first"', () => {
        expect(() => {
          knex(tblName).first().pluck(colName);
        }).to.throw(Error, 'Cannot chain .pluck() on "first" query');
      });
    });
  });
});
