const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('MSSQL dialect', () => {
  describe('Pooling', () => {
    getAllDbs()
      .filter((db) => {
        return db.startsWith('mssql');
      })
      .forEach((db) => {
        describe(db, () => {
          let knex;
          let connection;
          before(() => {
            knex = getKnexForDb(db, {
              pool: {
                afterCreate: (conn, done) => {
                  connection = conn;
                  done();
                },
                min: 3,
                max: 3,
              },
            });
          });

          after(() => {
            return knex.destroy();
          });

          it('uses node-mssql Tarn pool instance instead of creating a new one', async () => {
            await knex.raw('SELECT 1');
            expect(knex.client.pool.min).to.equal(3);
            expect(knex.client.pool.max).to.equal(3);
            expect(knex.client.pool === connection.pool).to.equal(true);
          });
        });
      });
  });
});
