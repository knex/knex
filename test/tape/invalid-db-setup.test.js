'use strict';

const _ = require('lodash');
const dialects = require('#test/knexfile.js');
const makeKnex = require('../../knex');
const { KnexTimeoutError } = require('../../lib/util/timeout');
const {
  getAllDbs,
  getKnexForDb,
} = require('../integration2/util/knex-instance-provider');

getAllDbs().forEach((db) => {
  describe(`${db} - invalid db setup`, () => {
    const dialect = db;

    // Tests for propagating errors when DB does not exist
    if (
      dialect !== 'sqlite3' &&
      dialect !== 'better-sqlite3' &&
      dialect !== 'oracledb' &&
      dialect !== 'mssql' &&
      dialect !== 'cockroachdb'
    ) {
      let knexBadDb;

      beforeAll(() => {
        // Get a normal knex instance to extract the config, then modify it
        const goodKnex = getKnexForDb(db);
        const knexConf = _.cloneDeep(dialects[db]);
        goodKnex.destroy();

        knexConf.connection.database = knexConf.connection.db =
          'i-refuse-to-exist';
        knexConf.acquireConnectionTimeout = 4000;
        knexBadDb = makeKnex(knexConf);
      });

      afterAll(async () => {
        if (knexBadDb) {
          await knexBadDb.destroy();
        }
      });

      it('propagate error when DB does not exist', async () => {
        try {
          const res = await knexBadDb('accounts').select(1);
          throw new Error(
            `Query should have failed, got: ${JSON.stringify(res)}`
          );
        } catch (e) {
          expect(e).not.toBeInstanceOf(KnexTimeoutError);
          expect(e.message).toContain('i-refuse-to-exist');
        }
      }, 10000);

      it('propagate error when DB does not exist for stream', async () => {
        try {
          const res = await knexBadDb.select(1).stream((stream) => {});
          throw new Error(
            `Stream query should have failed, got: ${JSON.stringify(res)}`
          );
        } catch (e) {
          expect(e).not.toBeInstanceOf(KnexTimeoutError);
          expect(e.message).toContain('i-refuse-to-exist');
        }
      }, 10000);
    }

    // Tests for acquireConnectionTimeout
    if (dialect !== 'sqlite3') {
      let knexTimeout;
      let trx;

      beforeAll(() => {
        const goodKnex = getKnexForDb(db);
        const knexConf = _.cloneDeep(dialects[db]);
        goodKnex.destroy();

        knexConf.acquireConnectionTimeout = 100;
        knexConf.pool = { max: 1, min: 1, acquireTimeoutMillis: 100 };
        knexTimeout = makeKnex(knexConf);
      });

      afterAll(async () => {
        if (trx) {
          try {
            await trx.commit();
          } catch (e) {
            // ignore
          }
        }
        if (knexTimeout) {
          await knexTimeout.destroy();
        }
      });

      it('acquireConnectionTimeout works', async () => {
        if (dialect === 'oracledb') {
          // acquireConnectionTimeout fails with oracledb
          return;
        }

        // just hog the only connection.
        trx = await knexTimeout.transaction();

        try {
          await knexTimeout('accounts').select(1);
          throw new Error('query should have stalled');
        } catch (e) {
          expect(e).toBeInstanceOf(KnexTimeoutError);
        } finally {
          await trx.commit();
          trx = null;
        }
        expect(true).toBe(true);
      }, 10000);
    }
  });
});
