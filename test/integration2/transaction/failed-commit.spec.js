const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const { isSQLite } = require('../../util/db-helpers');

describe('Transaction', () => {
  describe('failed commit', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        before(async function () {
          knex = getKnexForDb(db);
          if (!isSQLite(knex)) {
            return this.skip();
          }
          await knex.raw('PRAGMA foreign_keys = ON');
          await knex.raw('CREATE TABLE parent (id integer PRIMARY KEY)');
          await knex.raw(`
            CREATE TABLE child (
              id integer PRIMARY KEY,
              parent_id integer REFERENCES parent (id)
                DEFERRABLE INITIALLY DEFERRED
            )
          `);
        });

        after(async () => {
          if (isSQLite(knex)) {
            await knex.raw('DROP TABLE child');
            await knex.raw('DROP TABLE parent');
          }
          await knex.destroy();
        });

        it('rolls back the transaction that a failed COMMIT leaves open', async () => {
          let error;
          try {
            await knex.transaction((trx) =>
              trx('child').insert({ id: 1, parent_id: 1234 })
            );
          } catch (err) {
            error = err;
          }
          expect(error.message).to.include('FOREIGN KEY constraint failed');
          // A later transaction on the same connection works:
          await knex.transaction((trx) => trx('parent').insert({ id: 1 }));
          expect(await knex('parent').select('id')).to.deep.equal([{ id: 1 }]);
          expect(await knex('child').select('id')).to.deep.equal([]);
        });
      });
    });
  });
});
