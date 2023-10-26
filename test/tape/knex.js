'use strict';

const knex = require('../../lib/index');
const test = require('tape');
const fs = require('fs');

test('it should parse the connection string', function (t) {
  t.plan(1);
  const knexObj = knex({
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

test('it should allow to use proprietary dialect', function (t) {
  t.plan(2);
  const Client = require('../../lib/dialects/mysql');
  const knexObj = knex({
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

test('it should use knex supported dialect', function (t) {
  t.plan(1);
  const knexObj = knex({
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

test('it should support open flags selection for sqlite3', function (t) {
  t.plan(1);
  const knexObj = knex({
    client: 'sqlite3',
    connection: {
      filename: 'file:memdb-test?mode=memory',
      // allow the filename to be interpreted as a URI
      flags: ['OPEN_URI'],
    },
  });
  // run a query so a connection is created
  knexObj
    .select(knexObj.raw('"0"'))
    .then(() => {
      // if the filename was interpreted as a URI, no file should have been created
      t.equal(fs.existsSync('./file:memdb-test?mode=memory'), false);
    })
    .finally(() => {
      knexObj.destroy();
    });
});

test('it should error when invalid open flags are selected for sqlite3', function (t) {
  t.plan(2);

  // Test invalid flags
  let knexObj = knex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
      flags: ['NON_EXISTING'],
    },
  });
  // run a query so a connection is created
  knexObj
    .select(knexObj.raw('"0"'))
    .then(() => {
      t.fail('Should not get here');
    })
    .catch((err) => {
      t.equal(err.message, 'flag NON_EXISTING not supported by node-sqlite3');
    })
    .finally(() => {
      knexObj.destroy();
    });

  // test invalid config
  knexObj = knex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
      flags: 'OPEN_URI',
    },
  });
  // run a query so a connection is created
  knexObj
    .select(knexObj.raw('"0"'))
    .then(() => {
      t.fail('Should not get here');
    })
    .catch((err) => {
      t.equal(err.message, 'flags must be an array of strings');
    })
    .finally(() => {
      knexObj.destroy();
    });
});

test('it should throw error if client is omitted in config', function (t) {
  t.plan(1);
  try {
    knex({});
    t.deepEqual(true, false); //Don't reach this point
  } catch (error) {
    t.deepEqual(
      error.message,
      "knex: Required configuration option 'client' is missing."
    );
  }
});
