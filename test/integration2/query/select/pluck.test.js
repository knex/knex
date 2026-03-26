const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');

describe('Pluck', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      const tblName = 'test_table';
      const colName = 'test_col';

      beforeAll(async () => {
        knex = getKnexForDb(db);
        await knex.schema.dropTableIfExists(tblName);
        await knex.schema.createTable(tblName, (table) => {
          table.string(colName);
        });
      });

      afterAll(async () => {
        await knex.schema.dropTable(tblName);
        return knex.destroy();
      });

      it('Throws an error if used before before "first"', async () => {
        expect(() => {
          knex(tblName).pluck(colName).first();
        }).toThrow(Error, 'Cannot chain .first() on "pluck" query');
      });

      it('Throws an error if used before after "first"', () => {
        expect(() => {
          knex(tblName).first().pluck(colName);
        }).toThrow(Error, 'Cannot chain .pluck() on "first" query');
      });
    });
  });
});
