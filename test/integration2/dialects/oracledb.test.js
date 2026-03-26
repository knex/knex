const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const { getDriverName } = require('../../util/db-helpers');

describe('Oracledb dialect', () => {
  const dbs = getAllDbs().filter((db) => db === 'oracledb');

  dbs.forEach((db) => {
    describe(db, () => {
      let knex;
      beforeAll(() => {
        knex = getKnexForDb(db);
      });

      afterAll(() => {
        return knex.destroy();
      });

      describe('Connection configuration', () => {
        describe('#4869 inserting Buffer', async () => {
          it('.toSQL().toNative() generates correct sql and bindings for INSERT of Buffer', async () => {
            const b = Buffer.from('hello', 'utf-8');
            const query = knex('table1').insert({ value: b });
            const queryObj = query.toSQL().toNative();
            // Ensure we have two bindings, before fix for #4869 there would only have been one due
            // to silent dropping of the Buffer.
            expect(queryObj.bindings.length).toEqual(2);
            expect(queryObj).toEqual({
              sql: 'insert into "table1" ("value") values (:1) returning "value" into :2',
              bindings: [b, { type: 2019, dir: 3003 }],
            });
          });
        });

        describe('Version Detection', () => {
          it('should correctly resolve the oracle database version on connection if not specified', async () => {
            const client = knex.client;
            const connection = await client.acquireConnection();
            await client.releaseConnection(connection);

            expect(client.version).toMatch(/^\d+\.\d+$/);
          });

          it('should not attempt to dynamically resolve database version on connection if specified', async () => {
            // Manually specifying a version number other than the one we use for testing.
            const client = getKnexForDb('oracledb', { version: '12.2' }).client;
            const connection = await client.acquireConnection();
            await client.releaseConnection(connection);

            expect(client.version).toBe('12.2');
          });

          it('should dynamically resolve database version on connection if specified version is invalid', async () => {
            const client = getKnexForDb('oracledb', {
              version: 'not a good version number',
            }).client;
            const connection = await client.acquireConnection();
            await client.releaseConnection(connection);

            expect(client.version).toMatch(/^\d+\.\d+$/);
          });
        });
      });

      describe('Client', () => {
        describe('#5123 options not passed to driver', () => {
          it('should pass values supplied to .options() to the driver', async () => {
            const oracleDriver = require(getDriverName(knex));

            const query = knex
              .raw("select DATE '2022-05-25' as TEST_DATE from dual")
              .options({
                fetchInfo: { TEST_DATE: { type: oracleDriver.STRING } },
              });
            const [{ TEST_DATE: testDate }] = await query;

            expect(query.toSQL().options).toEqual({
              fetchInfo: { TEST_DATE: { type: oracleDriver.STRING } },
            });
            expect(testDate).toBeTypeOf('string');
          });
        });
      });
    });
  });
});
