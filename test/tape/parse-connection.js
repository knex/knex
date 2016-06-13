'use strict';

var parseConnection = require('../../lib/util/parse-connection')
var test = require('tape')

test('parses standard connections', function(t) {
  t.plan(1)
  t.deepEqual(parseConnection('postgres://username:pass@path.to.some-url:6000/testdb'), {
    client: 'postgres',
    connection: {
      user: 'username',
      password: 'pass',
      host: 'path.to.some-url',
      port: '6000',
      database: 'testdb'
    }
  })
})

test('parses standard connections without password', function(t) {
  t.plan(1)
  t.deepEqual(parseConnection('mysql://username@path.to.some-url:3306/testdb'), {
    client: 'mysql',
    connection: {
      user: 'username',
      host: 'path.to.some-url',
      port: '3306',
      database: 'testdb'
    }
  })
})

test('parses maria connections, aliasing database to db', function(t) {
  t.plan(3)
  var maria = {
    client: 'maria',
    connection: {
      user: 'username',
      password: 'pass',
      host: 'path.to.some-url',
      port: '6000',
      db: 'testdb'
    }
  }
  t.deepEqual(parseConnection('maria://username:pass@path.to.some-url:6000/testdb'), maria)
  t.deepEqual(parseConnection('mariasql://username:pass@path.to.some-url:6000/testdb'), maria)
  t.deepEqual(parseConnection('mariadb://username:pass@path.to.some-url:6000/testdb'), maria)
})

test('parses mssql connections, aliasing host to server', function(t) {
  t.plan(1)
  var mssql = {
    client: 'mssql',
    connection: {
      user: 'username',
      password: 'pass',
      server: 'path.to.some-url',
      port: '6000',
      database: 'testdb'
    }
  }
  t.deepEqual(parseConnection('mssql://username:pass@path.to.some-url:6000/testdb'), mssql)
})

test('assume a path is mysql', function(t) {
  t.plan(1)
  t.deepEqual(parseConnection('/path/to/file.db'), {
    client: 'sqlite3',
    connection: {
      filename: '/path/to/file.db'
    }
  })
})

test('#852, ssl param with PG query string', function(t) {
  t.plan(1)
  t.deepEqual(parseConnection("postgres://user:password@host:0000/database?ssl=true").connection, {
    host: "host",
    port: "0000",
    user: "user",
    password: "password",
    database: "database",
    ssl: true
  })
})
