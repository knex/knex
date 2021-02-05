'use strict';

const test = require('tape');
const Client = require('../../lib/dialects/sqlite3');
const tarn = require('tarn');
const Pool = tarn.Pool;
const knexfile = require('../knexfile');
const makeKnex = require('../../knex');
const delay = require('../../lib/execution/internal/delay');

test(`pool evicts dead resources when factory.validate rejects`, async (t) => {
  t.plan(10);

  let i = 0;
  const pool = new Pool({
    min: 2,
    max: 5,
    idleTimeoutMillis: 100,
    acquireTimeoutMillis: 100,

    create: () => {
      return { id: i++ };
    },

    validate: (res) => {
      return res.error ? false : true;
    },

    destroy: (res) => {
      return true;
    },
  });
  const fiveElements = Array.from(Array(5));
  const allocateConnections = () =>
    Promise.all(
      fiveElements.map(() =>
        pool.acquire().promise.catch((e) => {
          t.fail('Could not get resource from pool', e);
        })
      )
    );

  const connectionsGroup1 = await allocateConnections();
  connectionsGroup1.forEach((con) => pool.release(con));
  connectionsGroup1.forEach((con) => {
    // fake kill connections
    con.error = 'connection lost';
  });

  const connectionsGroup2 = await allocateConnections();
  connectionsGroup2.forEach((con) =>
    t.ok(con.id > 4, 'old dead connections were not reused')
  );
  connectionsGroup2.forEach((con) => pool.release(con));

  const connectionsGroup3 = await allocateConnections();
  connectionsGroup3.forEach((con) =>
    t.ok(con.id > 4 && con.id < 11, 'Released working connection was used')
  );
  connectionsGroup3.forEach((con) => pool.release(con));

  await pool.destroy();
  t.end();
});

test('#822, pool config, max: 0 should skip pool construction', function (t) {
  const client = new Client({
    connection: { filename: ':memory:' },
    pool: { max: 0 },
  });

  try {
    t.equal(client.pool, undefined);
    t.end();
  } finally {
    client.destroy();
  }
});

test('#823, should not skip pool construction pool config is not defined', function (t) {
  const client = new Client({ connection: { filename: ':memory:' } });
  try {
    t.ok(client.pool instanceof Pool);
    t.end();
  } finally {
    client.destroy();
  }
});

test('#2321 dead connections are not evicted from pool', async (t) => {
  if (knexfile['mysql2']) {
    const knex = makeKnex(knexfile['mysql2']);

    t.plan(10);
    try {
      await Promise.all(
        Array.from(Array(30)).map(() => {
          // kill all connections in pool
          return knex.raw(`KILL connection_id()`).catch(() => {
            // just ignore errors
          });
        })
      );

      // TODO: It looks like this test case can trigger the race condition
      //       outlined in this issue comment:
      //
      //         https://github.com/knex/knex/issues/3636#issuecomment-592005391
      //
      //       For now, we're working around this problem by introducing a
      //       1 second delay.  But, we should revisit this once the connection
      //       pool logic has been refactored.
      await delay(1000); // wait driver to notice connection errors (2ms was enough locally)

      // all connections are dead, so they should be evicted from pool and this should work
      await Promise.all(
        Array.from(Array(10)).map(() =>
          knex.select(1).then(() => t.pass('Read data'))
        )
      );
    } catch (e) {
      t.fail(
        `Should have created new connection and execute the query, got : ${e}`
      );
    } finally {
      t.end();
      await knex.destroy();
    }
  } else {
    t.end();
  }
});
