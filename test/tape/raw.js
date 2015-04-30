'use strict';

var Raw    = require('../../lib/raw');
var Client = require('../../lib/client')
var test   = require('tape')

var client = new Client()
function raw(sql, bindings) {
  return new Raw(client).set(sql, bindings)
}

test('allows for ?? to interpolate identifiers', function(t) {
  t.plan(1)
  t.equal(
    raw('select * from ?? where id = ?', ['table', 1]).toString(), 
    'select * from "table" where id = 1'
  )
})

test('allows for object bindings', function(t) {
  t.plan(1)
  t.equal(
    raw('select * from users where user_id = :userId and name = :name', {userId: 1, name: 'tim'}).toString(),
    "select * from users where user_id = 1 and name = 'tim'"
  )
})

test('allows for :val: for interpolated identifiers', function(t) {
  t.plan(1)
  t.equal(
    raw('select * from :table: where user_id = :userId and name = :name', {table: 'users', userId: 1, name: 'tim'}).toString(),
    "select * from \"users\" where user_id = 1 and name = 'tim'"
  )
})

test('allows for options in raw queries, #605', function(t) {
  t.plan(1)
  var x = raw("select 'foo', 'bar';")
    .options({ rowMode: "array" })
    .toSQL()

  t.deepEqual(x, {
    sql: "select 'foo', 'bar';",
    options: {rowMode: "array"},
    method: 'raw',
    bindings: undefined
  })
})
