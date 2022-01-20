const { expect } = require('chai');
const {
  Db,
  getAllDbs,
  getKnexForDb,
} = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('Type Consistency', () => {
    describe('Integers', () => {
      getAllDbs().forEach((db) => {
        describe(db, () => {
          let knex;
          const tblName = 'table_with_integers';
          const colNameInt = 'integer_test';
          const colNameBigInt = 'big_integer_test';

          before(async () => {
            knex = getKnexForDb(db);
            await knex.schema.dropTableIfExists(tblName);
            await knex.schema.createTable(tblName, (table) => {
              table.integer(colNameInt);
              table.bigInteger(colNameBigInt);
            });
            await knex(tblName).insert({
              integer: 15,
              bigInteger: 15,
            });
          });

          after(async () => {
            await knex.schema.dropTable(tblName);
            return knex.destroy();
          });

          it('Retrieves DB integers as JS numbers', async () => {
            const record = await knex.select('*').from(tblName).first();
            expect(record[colNameInt]).to.be.a('number').that.equals(15);
          });

          it('Retrieves DB bigIntegers as JS strings', async () => {
            const record = await knex.select('*').from(tblName).first();
            expect(record[colNameBigInt]).to.be.a('string').that.equals('15');
          });
        });
      });
    });
  });
});
