const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Oracledb dialect', () => {
  describe('Connection configuration', () => {
    const dbs = getAllDbs().filter((db) => db === 'oracledb');

    dbs.forEach((db) => {
      describe(db, () => {
        let knex;
        before(() => {
          knex = getKnexForDb(db);
        });

        after(() => {
          return knex.destroy();
        });

        describe('#4869 inserting Buffer', async () => {
          it('.toSQL().toNative() generates correct sql and bindings for INSERT of Buffer', async () => {
            const b = Buffer.from('hello', 'utf-8');
            const query = knex('table1').insert({ value: b });
            const queryObj = query.toSQL().toNative();
            // Ensure we have two bindings, before fix for #4869 there would only have been one due
            // to silent dropping of the Buffer.
            expect(queryObj.bindings.length).to.eql(2);
            expect(queryObj).to.eql({
              sql:
                'insert into "table1" ("value") values (:1) returning "value" into :2',
              bindings: [b, { type: 2019, dir: 3003 }],
            });
          });
        });

        describe('Version Detection', () => {
          it('should correctly resolve the oracle database version on connection if not specified', async () => {
            const client = knex.client;
            await client.acquireConnection();

            expect(client.version).to.match(/^\d+\.\d+$/);
          });

          it('should not attempt to dynamically resolve database version on connection if specified', async () => {
            // Manually specifying a version number other than the one we use for testing.
            const client = getKnexForDb('oracledb', { version: '12.2' }).client;
            await client.acquireConnection();

            expect(client.version).to.equal('12.2');
          });

          it('should dynamically resolve database version on connection if specified version is invalid', async () => {
            const client = getKnexForDb('oracledb', {
              version: 'not a good version number',
            }).client;
            await client.acquireConnection();

            expect(client.version).to.match(/^\d+\.\d+$/);
          });
        });
      });
    });
  });
});
