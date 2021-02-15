const { expect } = require('chai');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');

describe('Selects', () => {
  describe('FTS queries', () => {
    getAllDbs()
      // only sqlite is currently supported
      .filter((db) => db === 'sqlite3')
      .forEach((db) => {
        describe(db, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db);
          });

          after(() => {
            return knex.destroy();
          });

          beforeEach(async () => {
            // creating fts tables is not supported
            await knex.schema.raw(
              'CREATE VIRTUAL TABLE fts_products USING fts5(name);'
            );
          });

          afterEach(async () => {
            await knex.schema.dropTable('fts_products');
          });

          it('selects rows using basic text matching', async () => {
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
