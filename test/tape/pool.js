'use strict';

var test   = require('tape')
var Client = require('../../lib/dialects/sqlite3');
var Pool = require('generic-pool').Pool

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
