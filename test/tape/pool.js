'use strict';

var test   = require('tape')
var Client = require('../../lib/dialects/sqlite3');
var Pool = require('generic-pool').Pool
var knexfile = require('../knexfile');
var makeKnex = require('../../knex')

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
  Promise.all(Array.from(Array(30)).map(() => {
    // kill all connections in pool
    return knex.raw(`KILL connection_id()`).catch(() => {
      // just ignore errors
    });
  }))
  .then(() => {
    // all connections are dead, so they should be evicted from pool and this should work
    return Promise.all(Array.from(Array(10)).map(() => knex.select(1).then(() => t.pass())));
  })
  .catch(e => {
    t.fail(`Should have created new connection and execute the query, got : ${e}`);
  })
  .then(() => {
    t.end();
  });
});
