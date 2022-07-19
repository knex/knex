const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Oracledb dialect', () => {
  describe('Connection configuration', () => {
    const dbs = getAllDbs().filter((db) => db === 'oracledb');

    dbs.forEach((db) => {
      describe(db, () => {
        let knex;
        before(() => {
          knex = getKnexForDb(db, {
            connection: {
              user: 'user',
              password: 'password',
              connectString: 'connect-string',
              externalAuth: true,
              host: 'host',
              database: 'database',
            },
          });
        });

        after(() => {
          return knex.destroy();
        });

        describe('#4869 inserting Buffer', async () => {
          it('.toSQL().toNative() generates correct sql and bindings for INSERT of Buffer', async () => {
            const b = Buffer.from('hello', 'utf-8')
            const query = knex('table1').insert({ value: b })
            const queryObj = query.toSQL().toNative()
            // Ensure we have two bindings, before fix for #4869 there would only have been one due
            // to silent dropping of the Buffer.
            expect(queryObj.bindings.length).to.eql(2)
            expect(queryObj).to.eql({
              sql: 'insert into "table1" ("value") values (:1) returning "value" into :2',
              bindings: [b, { type: 2019, dir: 3003 }],
            });
          });
        });

      });
    });
  });
});
