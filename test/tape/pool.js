'use strict';

var test   = require('tape')
var Client = require('../../lib/dialects/sqlite3');
var Pool2  = require('pool2')

test('instantiating the client should not create pool implicitly', function(t) {

  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 1}})

  t.equal(client.pool, undefined, 'client.pool should be undefined')

  client.destroy(function() {
      t.end()
  })

})

test('pool must be created explicitly, after instantiating the client', function(t) {
  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 1}})
  client.initializePool(client.config, function() {
    t.ok(client.pool instanceof Pool2, 'client.pool should be an instance of Pool2')
    client.destroy(function() {
      t.end()
    })
  })
})
