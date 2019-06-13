'use strict';

const parseConnection = require('../../src/util/parse-connection');
const test = require('tape');

test('parses standard connections', function(t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('postgres://username:pass@path.to.some-url:6000/testdb'),
    {
      client: 'postgres',
      connection: {
        user: 'username',
        password: 'pass',
        host: 'path.to.some-url',
        port: '6000',
        database: 'testdb',
      },
    }
  );
});

test('parses standard connections without password', function(t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('mysql://username@path.to.some-url:3306/testdb'),
    {
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    }
  );
});

test('parses mssql connections, aliasing host to server', function(t) {
  t.plan(1);
  const mssql = {
    client: 'mssql',
    connection: {
      user: 'username',
      password: 'pass',
      server: 'path.to.some-url',
      port: '6000',
      database: 'testdb',
    },
  };
  t.deepEqual(
    parseConnection('mssql://username:pass@path.to.some-url:6000/testdb'),
    mssql
  );
});

test('assume a path is mysql', function(t) {
  t.plan(1);
  t.deepEqual(parseConnection('/path/to/file.db'), {
    client: 'sqlite3',
    connection: {
      filename: '/path/to/file.db',
    },
  });
});

test('#852, ssl param with PG query string', function(t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('postgres://user:password@host:0000/database?ssl=true')
      .connection,
    {
      host: 'host',
      port: '0000',
      user: 'user',
      password: 'password',
      database: 'database',
      ssl: true,
    }
  );
});

test('support postgresql connection protocol', function(t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('postgresql://user:password@host:0000/database?ssl=true')
      .connection,
    {
      host: 'host',
      port: '0000',
      user: 'user',
      password: 'password',
      database: 'database',
      ssl: true,
    }
  );
});
