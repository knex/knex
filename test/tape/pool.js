'use strict';

var test   = require('tape')
var Client = require('../../lib/dialects/sqlite3');
var Pool2  = require('pool2')

test('instantiating the client should not create pool implicitly', function(t) {

  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 1}})

  t.equal(client.pool, undefined, 'client.pool should be undefined')

  client.destroy(function(err) {
    t.end(err)
  })

})

test('pool may be created explicitly, after instantiating the client', function(t) {
  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 1}})
  client.initializePool(client.config, function(err) {
    if (err) {
      t.end(err)
    }
    t.ok(client.pool instanceof Pool2, 'client.pool should be an instance of Pool2')
    client.destroy(function(err) {
      t.end(err)
    })
  })
})

test('pool will be created implicitly, if necessary, upon attempting to acquire the first connection', function(t) {
  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 1}})
  client.acquireConnection(function(err, connection) {
    if (err) {
      t.end(err)
    }
    t.ok(client.pool instanceof Pool2, 'client.pool should be an instance of Pool2')
    client.releaseConnection(connection, function(err) {
      if (err) {
        t.end(err)
      }
      client.destroy(function(err) {
        t.end(err)
      })
    })
  })
})
