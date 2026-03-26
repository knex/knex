'use strict';

const {
  Db,
  getKnexForDb,
  getAllDbs,
} = require('../util/knex-instance-provider');

describe('CockroachDB dialect', () => {
  getAllDbs()
    .filter((db) => db === Db.CockroachDB)
    .forEach((db) => {
      describe(db, () => {
        let knex;
        beforeAll(async () => {
          knex = getKnexForDb(db);
          await knex.schema.dropTableIfExists('test');
          await knex.schema.createTable('test', function () {
            this.increments('id').primary();
            this.decimal('balance');
            this.string('name');
          });
          return async () => {
            await knex.schema.dropTable('test');
            await knex.destroy();
          };
        });

        describe('Upsert into query with unique', () => {
          it('select empty table', async () => {
            const results = await knex('test').select();
            expect(results).toHaveLength(0);
          });

          it('upsert id=1 with result insert', async () => {
            const results = await knex('test').upsert({ id: 1, balance: 10 });
            expect(results.command).toEqual('INSERT');
            expect(results.rowCount).toEqual(1);
          });

          it('select rows', async () => {
            const results = await knex('test').select();
            expect(results).toEqual([
              { id: '1', balance: '10.00', name: null },
            ]);
          });

          it('upsert id=1 with result update balance', async () => {
            const results = await knex('test').upsert({ id: 1, balance: 5 });
            expect(results.command).toEqual('INSERT');
            expect(results.rowCount).toEqual(1);
          });

          it('select rows', async () => {
            const results = await knex('test').select();
            expect(results.length).toEqual(1);
            expect(results).toEqual([{ id: '1', balance: '5.00', name: null }]);
          });
        });
      });
    });
});
