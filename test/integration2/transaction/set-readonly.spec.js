const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const { isSQLite, isMssql, isOracle } = require('../../util/db-helpers');
const { expect } = require('chai');
const { describe, it } = require('node:test');

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

        it('Expect insert in read only transaction to be rejected', async () => {
          if (isSQLite(knex) || isOracle(knex) || isMssql(knex)) {
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
      })
    })
  });
});