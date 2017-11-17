'use strict';

var test   = require('tape')
var Client = require('../../lib/dialects/sqlite3');
var genericPool = require('generic-pool');
var Pool = genericPool.Pool;
var knexfile = require('../knexfile');
var makeKnex = require('../../knex')
const Bluebird = require('bluebird');

test(`pool evicts dead resources when factory.validate rejects`, t => {
  t.plan(10);

  let i = 0;
  let pool = genericPool.createPool({
      create: () => {
        return { id: i++ };
      },
      validate: res => {
        return res.error ? false : true;
      },
      destroy: res => {
        return true;
      }
    }, {
      max: 5,
      idleTimeoutMillis: 100,
      acquireTimeoutMillis: 100,
      testOnBorrow: true
    });


  let connections = Bluebird.resolve(Array.from(Array(5)))
    .map(() => {
      return pool.acquire()
        .catch(e => {
          t.fail('1# Could not get resource from pool');
        });
    })
    .map(con => pool.release(con).then(() => con))
    .map(con => {
      // fake kill connections
      con.error = 'connection lost';
      return con;
    })
    .map(con => {
      // old cons should have been evicted due to testOnBorrow
      return pool.acquire()
        .then(con => {
          t.ok(con.id > 4, 'old dead connections were not reused');
          return con;
        })
        .catch(e => {
          t.fail('2# Could not get resource from pool');
        });
    })
    .map(con => pool.release(con))
    .map(con => {
      return pool.acquire().then(con => {
        t.ok(con.id > 4 && con.id < 11, 'Released working connection was used');
        return con;
      });
    })
    .map(con => pool.release(con))
    .then(() => pool.drain().then(() => pool.clear()))
    .then(() => {
      t.end();
    });
});

test('#822, pool config, max: 0 should skip pool construction', function(t) {

  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 0}})

  try {
    t.equal(client.pool, undefined)
    t.end()
  } finally {
    client.destroy()
  }

})

test('#823, should not skip pool construction pool config is not defined', function(t) {

  var client = new Client({connection: {filename: ':memory:'}})
  try {
    t.ok(client.pool instanceof Pool)
    t.end()
  } finally {
    client.destroy()
  }

})

test('#2321 dead connections are not evicted from pool', (t) => {
  const knex = makeKnex(knexfile['mysql2']);
  t.on('result', res => {
    knex.destroy();
  });

  t.plan(10);
  Bluebird.all(Array.from(Array(30)).map(() => {
    // kill all connections in pool
    return knex.raw(`KILL connection_id()`).catch(() => {
      // just ignore errors
    });
  }))
  .delay(50) // wait driver to notice connection errors (2ms was enough locally)
  .then(() => {
    // all connections are dead, so they should be evicted from pool and this should work
    return Promise.all(Array.from(Array(10)).map(
      () => knex.select(1).then(() => t.pass('Read data'))
    ));
  })
  .catch(e => {
    t.fail(`Should have created new connection and execute the query, got : ${e}`);
  })
  .then(() => {
    t.end();
  });
});
