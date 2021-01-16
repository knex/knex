'use strict';

const tape = require('tape');
const _ = require('lodash');
const makeKnex = require('../../knex');
const { KnexTimeoutError } = require('../../lib/util/timeout');

module.exports = (knexfile) => {
  Object.keys(knexfile).forEach((key) => {
    const dialect = knexfile[key].dialect || knexfile[key].client;

    // TODO: FIX ORACLE AND MSSQL TO WORK THE SAME WAY WITH OTHER DIALECTS IF POSSIBLE
    if (
      dialect !== 'sqlite3' &&
      dialect !== 'oracledb' &&
      dialect !== 'mssql'
    ) {
      const knexConf = _.cloneDeep(knexfile[key]);
      knexConf.connection.database = knexConf.connection.db =
        'i-refuse-to-exist';
      knexConf.acquireConnectionTimeout = 4000;
      const knex = makeKnex(knexConf);

      tape(dialect + ' - propagate error when DB does not exist', (t) => {
        t.plan(2);
        t.timeoutAfter(1000);
        knex('accounts')
          .select(1)
          .then((res) => {
            t.fail(`Query should have failed, got: ${JSON.stringify(res)}`);
          })
          .catch((e) => {
            t.notOk(
              e instanceof KnexTimeoutError,
              `Query should have failed with non timeout error`
            );
            t.ok(
              e.message.indexOf('i-refuse-to-exist') > 0,
              `all good, failed as expected with msg: ${e.message}`
            );
          });
      });

      tape(
        dialect + ' - propagate error when DB does not exist for stream',
        (t) => {
          t.plan(2);
          t.timeoutAfter(1000);

          knex
            .select(1)
            .stream((stream) => {})
            .then((res) => {
              t.fail(
                `Stream query should have failed, got: ${JSON.stringify(res)}`
              );
            })
            .catch((e) => {
              t.notOk(
                e instanceof KnexTimeoutError,
                'Stream query should have failed with non timeout error'
              );
              t.ok(
                e.message.includes('i-refuse-to-exist'),
                `all good, failed as expected with msg: ${e.message}`
              );
            });
        }
      );

      tape.onFinish(() => {
        knex.destroy();
      });
    }

    if (dialect !== 'sqlite3') {
      const knexConf = _.cloneDeep(knexfile[key]);
      knexConf.acquireConnectionTimeout = 100;
      knexConf.pool = { max: 1, min: 1, acquireTimeoutMillis: 100 };
      const knex = makeKnex(knexConf);

      tape.onFinish(() => {
        knex.destroy();
      });

      tape(dialect + ' - acquireConnectionTimeout works', async (t) => {
        if (dialect === 'oracledb') {
          t.skip(
            '!!!!!!! acquireConnectionTimeout fails with oracledb! please fix. !!!!!!!!'
          );
          t.end();
          return;
        }

        t.plan(2);
        t.timeoutAfter(1000);

        // just hog the only connection.
        const trx = await knex.transaction();

        try {
          await knex('accounts').select(1);

          t.fail('query should have stalled');
        } catch (e) {
          t.ok(e instanceof KnexTimeoutError, 'Got acquireTimeout error');
        } finally {
          trx.commit();
        }
        t.pass('transaction was resolved');
        t.end();
      });
    }
  });
};
