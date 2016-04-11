'use strict';

var test   = require('tape')
var Client = require('../../lib/dialects/sqlite3');
var Pool2  = require('pool2')

test('#822, pool config, max: 0 should skip pool construction', function(t) {

  var client = new Client({connection: {filename: ':memory:'}, pool: {max: 0}})

  t.equal(client.pool, undefined)

  client.destroy()

  t.end()

})

test('#823, should not skip pool construction pool config is not defined', function(t) {

  var client = new Client({connection: {filename: ':memory:'}})

  t.ok(client.pool instanceof Pool2)

  client.destroy()

  t.end()

})