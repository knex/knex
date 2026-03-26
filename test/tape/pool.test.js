'use strict';

const Client = require('../../lib/dialects/sqlite3');
const tarn = require('tarn');
const Pool = tarn.Pool;
const knexfile = require('../knexfile');
const makeKnex = require('../../knex');
const delay = require('../../lib/execution/internal/delay');

describe('Pool', () => {
  it('pool evicts dead resources when factory.validate rejects', async () => {
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
        return !res.error;
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
            throw new Error('Could not get resource from pool: ' + e);
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
      expect(con.id).toBeGreaterThan(4)
    );
    connectionsGroup2.forEach((con) => pool.release(con));

    const connectionsGroup3 = await allocateConnections();
    connectionsGroup3.forEach((con) => {
      expect(con.id).toBeGreaterThan(4);
      expect(con.id).toBeLessThan(11);
    });
    connectionsGroup3.forEach((con) => pool.release(con));

    await pool.destroy();
  });

  it('#822, pool config, max: 0 should skip pool construction', () => {
    const client = new Client({
      connection: { filename: ':memory:' },
      pool: { max: 0 },
    });

    try {
      expect(client.pool).toBeUndefined();
    } finally {
      client.destroy();
    }
  });

  it('#823, should not skip pool construction pool config is not defined', () => {
    const client = new Client({ connection: { filename: ':memory:' } });
    try {
      expect(client.pool).toBeInstanceOf(Pool);
    } finally {
      client.destroy();
    }
  });

  it('#2321 dead connections are not evicted from pool (mysql)', async () => {
    if (!knexfile['mysql']) {
      return;
    }

    const knex = makeKnex(knexfile['mysql']);

    try {
      await Promise.all(
        Array.from(Array(30)).map(() => {
          // kill all connections in pool
          return knex.raw(`KILL connection_id()`).catch(() => {
            // just ignore errors
          });
        })
      );

      // wait driver to notice connection errors
      await delay(1000);

      // all connections are dead, so they should be evicted from pool and this should work
      const results = await Promise.all(
        Array.from(Array(10)).map(() => knex.select(1))
      );
      expect(results).toHaveLength(10);
    } finally {
      await knex.destroy();
    }
  });

  it('#2321 dead connections are not evicted from pool (mysql2)', async () => {
    if (!knexfile['mysql2']) {
      return;
    }

    const knex = makeKnex(knexfile['mysql2']);

    try {
      await Promise.all(
        Array.from(Array(30)).map(() => {
          // kill all connections in pool
          return knex.raw(`KILL connection_id()`).catch(() => {
            // just ignore errors
          });
        })
      );

      // wait driver to notice connection errors
      await delay(1000);

      // all connections are dead, so they should be evicted from pool and this should work
      const results = await Promise.all(
        Array.from(Array(10)).map(() => knex.select(1))
      );
      expect(results).toHaveLength(10);
    } finally {
      await knex.destroy();
    }
  });
});
