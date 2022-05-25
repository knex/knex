const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const oracledb = require('oracledb');

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
            const b = Buffer.from('hello', 'utf-8');
            const query = knex('table1').insert({ value: b });
            const queryObj = query.toSQL().toNative();
            // Ensure we have two bindings, before fix for #4869 there would only have been one due
            // to silent dropping of the Buffer.
            expect(queryObj.bindings.length).to.eql(2);
            expect(queryObj).to.eql({
              sql: 'insert into "table1" ("value") values (:1) returning "value" into :2',
              bindings: [b, { type: 2019, dir: 3003 }],
            });
          });
        });
      });
    });
  });

  describe('Client', () => {
    let knex;

    before(() => {
      knex = getKnexForDb('oracledb');
    });

    after(() => {
      return knex.destroy();
    });

    describe('#5123 options not passed to driver', () => {
      it('should pass values supplied to .options() to the driver', async () => {
        const query = knex
          .raw("select DATE '2022-05-25' as TEST_DATE from dual")
          .options({ fetchInfo: { TEST_DATE: { type: oracledb.STRING } } });
        const [{ TEST_DATE: testDate }] = await query;

        expect(query.toSQL().options).to.deep.equal({
          fetchInfo: { TEST_DATE: { type: oracledb.STRING } },
        });
        expect(testDate).to.be.a('string');
      });
    });
  });
});
