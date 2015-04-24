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

test('parses maria connections, aliasing database to db', function(t) {
  
  t.plan(3)

  t.deepEqual(parseConnection('maria://username:pass@path.to.some-url:6000/testdb'), {

    client: 'maria',

    connection: {
      user: 'username',
      password: 'pass',
      host: 'path.to.some-url',
      port: '6000',
      db: 'testdb'
    }

  })

  t.deepEqual(parseConnection('mariasql://username:pass@path.to.some-url:6000/testdb'), {

    client: 'maria',

    connection: {
      user: 'username',
      password: 'pass',
      host: 'path.to.some-url',
      port: '6000',
      db: 'testdb'
    }

  })

  t.deepEqual(parseConnection('mariadb://username:pass@path.to.some-url:6000/testdb'), {

    client: 'maria',

    connection: {
      user: 'username',
      password: 'pass',
      host: 'path.to.some-url',
      port: '6000',
      db: 'testdb'
    }

  })  

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