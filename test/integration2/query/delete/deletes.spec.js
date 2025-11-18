'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;

const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');

describe('Deletes', function () {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      const tableName = 'knex_test_delete_9440';
      /** @type {import('../../../../types/index').Knex} */
      let knex;

      before(async () => {
        knex = logger(getKnexForDb(db));
        const exists = await knex.schema.hasTable(tableName);
        if (exists) {
          await knex.schema.dropTable(tableName);
        }
        await knex.schema.createTable(tableName, (tb) => {
          tb.increments('id').primary();
          tb.integer('num');
        });
      });

      beforeEach(async () => {
        await knex(tableName).truncate();
      });

      after(async () => {
        await knex.schema.dropTable(tableName);
      });

      const table1 = ['del', 'delete', 'truncate'];
      table1.forEach((method) => {
        it(`throws on .${method}() with limit`, async () => {
          await knex(tableName).insert([{ num: 3 }, { num: 4 }]);
          await expect(
            knex(tableName).limit(1)[method]()
          ).to.eventually.be.rejectedWith(/limit.*no effect/);
          await expect(knex(tableName)[method]()).to.eventually.be.fulfilled;
        });
      });
    });
  });
});
