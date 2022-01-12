const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('MySQL dialect', () => {
  describe('Connection configuration', () => {
    const dbs = getAllDbs().filter((db) => {
      return db.startsWith('mysql');
    });

    dbs.forEach((db) => {
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

        describe(`${db} - connection string with string SSL profile`, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db, {
              /* eslint-disable-next-line no-useless-escape */
              connection: `${db.replace(
                'mysql2',
                'mysql'
              )}://testuser:testpassword@127.0.0.1:23306/knex_test?ssl=Knex Test`,
            });
          });

          after(() => {
            return knex.destroy();
          });

          it('it connects when using string profile for SSL', async () => {
            try {
              await knex.schema.raw("SHOW STATUS LIKE 'Ssl_cipher'");
            } catch (err) {
              expect(err.message).to.eq("Unknown SSL profile 'Knex Test'");
            }
          });
        });

        describe(`${db} - connection string with JSON`, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db, {
              connection: `${db.replace(
                'mysql2',
                'mysql'
              )}://testuser:testpassword@127.0.0.1:23306/knex_test?ssl={"rejectUnauthorized": false}`,
            });
          });

          after(() => {
            return knex.destroy();
          });

          it('it connects when using JSON query strings for SSL', async () => {
            const result = await knex.schema.raw(
              "SHOW STATUS LIKE 'Ssl_cipher'"
            );
            expect(result[0][0].Value).not.to.be.empty;
          });
        });
      });
    });
  });
});
