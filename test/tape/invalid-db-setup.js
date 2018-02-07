'use strict';

const tape = require('tape')
const _ = require('lodash');
const makeKnex = require('../../knex')
const Bluebird = require('bluebird');

module.exports = (knexfile) => {
  Object.keys(knexfile).forEach((key) => {
    const dialect = knexfile[key].dialect || knexfile[key].client;

    if (dialect !== 'sqlite3' && dialect !== 'oracledb') {
      const knexConf = _.cloneDeep(knexfile[key]);
      knexConf.connection.database = knexConf.connection.db = 'i-refuse-to-exist';
      knexConf.acquireConnectionTimeout = 4000;
      const knex = makeKnex(knexConf);

      tape(dialect + ' - propagate error when DB does not exist', t => {
        t.plan(1);
        t.timeoutAfter(1000);
        knex('accounts').select(1)
          .then(res => {
            t.fail(`Query should have failed, got: ${JSON.stringify(res)}`);
          })
          .catch(Bluebird.TimeoutError, e => {
            t.fail(`Query should have failed with non timeout error`);
          })
          .catch(e => {
            t.ok(e.message.indexOf('i-refuse-to-exist') > 0, `all good, failed as expected with msg: ${e.message}`);
          });
      });

      tape(dialect + ' - propagate error when DB does not exist for stream', t => {
        t.plan(1);
        t.timeoutAfter(1000);

        knex.select(1)
          .stream(stream => {})
          .then(res => {
            t.fail(`Stream query should have failed, got: ${JSON.stringify(res)}`);
          })
          .catch(Bluebird.TimeoutError, e => {
            t.fail(`Stream query should have failed with non timeout error`);
          })
          .catch(e => {
            t.ok(e.message.indexOf('i-refuse-to-exist') > 0, `all good, failed as expected with msg: ${e.message}`);
          });
      });

      tape.onFinish(() => {
        knex.destroy();
      });
    }

    if (dialect !== 'sqlite3') {
      const knexConf = _.cloneDeep(knexfile[key]);
      knexConf.acquireConnectionTimeout = 100;
      knexConf.pool = { max: 1, min: 1 };
      const knex = makeKnex(knexConf);

      tape.onFinish(() => {
        knex.destroy();
      });

      tape(dialect + ' - acquireConnectionTimeout works', t => {
        t.plan(2);
        t.timeoutAfter(1000);

        // just hog the only connection.
        knex.transaction(trx => {
          // Don't return this promise! Also note that we use `knex` instead of `trx`
          // here on purpose. The only reason this code is here, is that we can be
          // certain `trx` has been created before this.
          knex('accounts').select(1)
            .then(() => {
              t.fail('query should have stalled');
            })
            .catch(Bluebird.TimeoutError, e => {
              t.pass('Got acquireTimeout error');
            })
            .catch(e => {
              t.fail(`should have got acquire timeout error, but got ${e.message} instead.`);
            })
            .finally(() => {
              trx.commit(); // release stuff
            });

        }).then(() => {
          t.pass('transaction was resolved');
          t.end();
        });
      });
    }

  });
};
