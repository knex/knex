const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('MySQL dialect', () => {
  describe('Connection configuration', () => {
    getAllDbs()
      .filter((db) => {
        return db.startsWith('mysql');
      })
      .forEach((db) => {
        describe(db, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db, {
              connection: {
                host: '127.0.0.1',
                port: 601,
                user: 'root',
                password: 'test',
                database: 'test',
              },
            });
          });

          after(() => {
            return knex.destroy();
          });

          it('uses correct port for connecting', async () => {
            try {
              await knex.schema.raw('SELECT 1 as 1');
              throw new Error('Should not reach here');
            } catch (err) {
              expect(err.message).to.eql('connect ECONNREFUSED 127.0.0.1:601');
            }
          });
        });
      });
  });
});
