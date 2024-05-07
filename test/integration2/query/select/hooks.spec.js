const { expect } = require('chai');
const {
  Db,
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');

describe('Selects', () => {
  describe('select query', () => {
    getAllDbs()
      // only sqlite is currently supported
      .filter((db) => db === Db.SQLite)
      .forEach((db) => {
        describe(db, () => {
          let knex;

          after(() => {
            return knex.destroy();
          });

          afterEach(async () => {
            await knex.schema.dropTable('fts_products');
          });

          /* this is a good example for when you might have a pre hook
             that checks some other cache first and returns that data on HIT
             If HIT one would set continue to false to indicate not to EXEC the SQL,
             but rather short circuit with cache data
          */
          it('does not query DB and returns data from preExecHook', async () => {
            const settings = {
              preExecHook(queryObj) {
                return Promise.resolve({
                  continue: false,
                  data: ['short circuit pre exec hook'],
                });
              },
            };

            knex = getKnexForDb(db, settings);
            await knex.schema.raw(
              'CREATE VIRTUAL TABLE fts_products USING fts5(name);'
            );

            const matchingRows = await knex
              .select('*')
              .from('fts_products')
              .where('name', 'match', 'red shirt');

            expect(matchingRows).to.eql(['short circuit pre exec hook']);
          });

          /* example preExecHook where SQL is executed as continue is true
             In the above cache example in this case it would represent a MISS,
             where you would fall back to EXEC SQL and then you could store response
             in local cache.

             Or you could use continue as true in other example for some generic logging
             and such.
          */
          it('defines preExecHook but returns data from db', async () => {
            const settings = {
              preExecHook(queryObj) {
                return Promise.resolve({ continue: true });
              },
            };

            knex = getKnexForDb(db, settings);
            await knex.schema.raw(
              'CREATE VIRTUAL TABLE fts_products USING fts5(name);'
            );

            await knex('fts_products').insert([
              { name: 'Red flannel shirt' },
              { name: 'Blue flannel shirt' },
              { name: 'Red polo shirt' },
              { name: 'Blue polo shirt' },
              { name: 'Red hooded jacket' },
              { name: 'Blue hooded jacket' },
            ]);

            const matchingRows = await knex
              .select('*')
              .from('fts_products')
              .where('name', 'match', 'red shirt');

            expect(matchingRows).to.eql([
              { name: 'Red flannel shirt' },
              { name: 'Red polo shirt' },
            ]);
          });
        });
      });
  });
});
