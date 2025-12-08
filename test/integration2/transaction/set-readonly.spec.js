const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const {
  isSQLite,
  isMssql,
  isOracle,
  isCockroachDB,
} = require('../../util/db-helpers');
const { expect } = require('chai');

describe('Transaction', () => {
  describe('setReadOnly', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const tableName = 'key_value';

        before(() => {
          knex = getKnexForDb(db);
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable(tableName, (table) => {
            table.integer('id').primary().notNull();
            table.integer('value').notNull();
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable(tableName);
        });

        // FixMe this test started failing for some reason: https://github.com/knex/knex/issues/5750
        it.skip('Expect insert in read only transaction to be rejected', async () => {
          if (
            isSQLite(knex) ||
            isOracle(knex) ||
            isMssql(knex) ||
            isCockroachDB(knex)
          ) {
            return;
          }

          await expect(
            knex.transaction(
              async (trx) => {
                await trx(tableName).insert({ id: 1, value: 1 });
              },
              { readOnly: true }
            )
          ).to.be.rejected;
        });
      });
    });
  });
});
