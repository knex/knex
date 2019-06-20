'use strict';

const test = require('tape');
const Client = require('../../src/dialects/sqlite3');
const tarn = require('tarn');
const Pool = tarn.Pool;
const knexfile = require('../knexfile');
const makeKnex = require('../../knex');
const Bluebird = require('bluebird');

test(`pool evicts dead resources when factory.validate rejects`, (t) => {
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

  Bluebird.resolve(Array.from(Array(5)))
    .map(() => {
      return pool.acquire().promise.catch((e) => {
        t.fail('1# Could not get resource from pool');
      });
    })
    .map((con) => {
      pool.release(con);
      return con;
    })
    .map((con) => {
      // fake kill connections
      con.error = 'connection lost';
      return con;
    })
    .map((con) => {
      return pool
        .acquire()
        .promise.then((con) => {
          t.ok(con.id > 4, 'old dead connections were not reused');
          return con;
        })
        .catch((e) => {
          t.fail('2# Could not get resource from pool');
        });
    })
    .map((con) => {
      pool.release(con);
      return con;
    })
    .map((con) => {
      return pool.acquire().promise.then((con) => {
        t.ok(con.id > 4 && con.id < 11, 'Released working connection was used');
        return con;
      });
    })
    .map((con) => {
      pool.release(con);
      return con;
    })
    .then(() => pool.destroy())
    .then(() => {
      t.end();
    });
});

test('#822, pool config, max: 0 should skip pool construction', function(t) {
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

test('#823, should not skip pool construction pool config is not defined', function(t) {
  const client = new Client({ connection: { filename: ':memory:' } });
  try {
    t.ok(client.pool instanceof Pool);
    t.end();
  } finally {
    client.destroy();
  }
});

test('#2321 dead connections are not evicted from pool', (t) => {
  if (knexfile['mysql2']) {
    const knex = makeKnex(knexfile['mysql2']);

    t.plan(10);
    Bluebird.all(
      Array.from(Array(30)).map(() => {
        // kill all connections in pool
        return knex.raw(`KILL connection_id()`).catch(() => {
          // just ignore errors
        });
      })
    )
      .delay(50) // wait driver to notice connection errors (2ms was enough locally)
      .then(() => {
        // all connections are dead, so they should be evicted from pool and this should work
        return Bluebird.all(
          Array.from(Array(10)).map(() =>
            knex.select(1).then(() => t.pass('Read data'))
          )
        );
      })
      .catch((e) => {
        t.fail(
          `Should have created new connection and execute the query, got : ${e}`
        );
      })
      .then(() => {
        t.end();
      })
      .finally(() => {
        return knex.destroy();
      });
  } else {
    t.end();
  }
});
