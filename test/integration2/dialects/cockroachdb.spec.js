'use strict';

const { expect } = require('chai');
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
        before(async () => {
          knex = getKnexForDb(db);

          await knex.schema.createTable('test', function () {
            this.increments('id').primary();
            this.decimal('balance');
            this.string('name');
          });
        });

        after(async () => {
          await knex.schema.dropTable('test');
          await knex.destroy();
        });

        describe('Upsert into query with unique', () => {
          it('select empty table', async () => {
            const results = await knex('test').select();
            expect(results).is.empty;
          });

          it('upsert id=1 with result insert', async () => {
            const results = await knex('test').upsert({ id: 1, balance: 10 });
            expect(results.command).to.eql('INSERT');
            expect(results.rowCount).to.eql(1);
          });

          it('select rows', async () => {
            const results = await knex('test').select();
            expect(results).to.eql([{ id: '1', balance: '10.00', name: null }]);
          });

          it('upsert id=1 with result update balance', async () => {
            const results = await knex('test').upsert({ id: 1, balance: 5 });
            expect(results.command).to.eql('INSERT');
            expect(results.rowCount).to.eql(1);
          });

          it('select rows', async () => {
            const results = await knex('test').select();
            expect(results.length).to.eql(1);
            expect(results).to.eql([{ id: '1', balance: '5.00', name: null }]);
          });
        });
      });
    });
});
