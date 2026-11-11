const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const { isSQLite } = require('../../util/db-helpers');
const { expect } = require('chai');

describe('Transaction', () => {
  describe('statements sent before a rollback', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const tableName = 'statement_order';

        before(function () {
          knex = getKnexForDb(db);
          if (!isSQLite(knex)) {
            return this.skip();
          }
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable(tableName, (table) => {
            table.increments('id');
            table.string('value');
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable(tableName);
        });

        // node-sqlite3 runs statements in parallel mode unless the connection
        // is serialized, so an INSERT sent before the ROLLBACK could run after
        // it, outside the transaction, and be committed.
        it('rolls back inserts that were sent before the rollback', async () => {
          for (let round = 0; round < 50; round++) {
            const trx = await knex.transaction();
            const inserts = [];
            let rollback;

            for (let i = 0; i < 10; i++) {
              const insert = trx(tableName).insert({ value: `${round}-${i}` });
              if (i === 9) {
                // Roll back right after the last INSERT is handed to the driver.
                insert.on('query', () => {
                  rollback = new Promise((resolve) =>
                    queueMicrotask(() =>
                      trx
                        .rollback()
                        .catch(() => {})
                        .then(resolve)
                    )
                  );
                });
              }
              inserts.push(
                insert.then(
                  () => {},
                  () => {}
                )
              );
            }

            await Promise.all(inserts);
            await rollback;

            const rows = await knex(tableName).select('value');
            expect(rows, `round ${round}`).to.deep.equal([]);
          }
        });
      });
    });
  });
});
