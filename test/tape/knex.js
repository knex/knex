'use strict';

var knex = require('../../lib/index');
var test = require('tape');

test('it should parse the connection string', function(t) {
  t.plan(1);
  var knexObj = knex({
    client: 'mysql',
    connection: 'mysql://user:password@localhost/dbname',
  });
  t.deepEqual(knexObj.client.config.connection, {
    database: 'dbname',
    host: 'localhost',
    password: 'password',
    user: 'user',
  });
  knexObj.destroy();
});

test('it should allow to use proprietary dialect', function(t) {
  t.plan(2);
  var Client = require('../../lib/dialects/mysql');
  var knexObj = knex({
    client: Client,
    connection: {
      database: 'dbname',
      host: 'localhost',
      password: 'password',
      user: 'user',
    },
  });
  t.ok(knexObj.client instanceof Client);
  t.deepEqual(knexObj.client.config, {
    client: Client,
    connection: {
      database: 'dbname',
      host: 'localhost',
      password: 'password',
      user: 'user',
    },
  });
  knexObj.destroy();
});

test('it should use knex supported dialect', function(t) {
  t.plan(1);
  var knexObj = knex({
    client: 'postgres',
    connection: {
      database: 'dbname',
      host: 'localhost',
      password: 'password',
      user: 'user',
    },
  });
  t.deepEqual(knexObj.client.config, {
    client: 'postgres',
    connection: {
      database: 'dbname',
      host: 'localhost',
      password: 'password',
      user: 'user',
    },
  });
  knexObj.destroy();
});

test('it should throw error if client is omitted in config', function(t) {
  t.plan(1);
  try {
    var knexObj = knex({});
    t.deepEqual(true, false); //Don't reach this point
  } catch (error) {
    t.deepEqual(
      error.message,
      "knex: Required configuration option 'client' is missing."
    );
  }
});
