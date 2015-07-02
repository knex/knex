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

test('raw query strings with keys replace values', function(t) {
  
  t.plan(2)
  
  t.equal(raw('select :item from :place', {}).toSQL().sql, 'select from')

  t.equal(raw('select :item :cool 2 from :place', {}).toSQL().sql, 'select 2 from')

})

test('raw bindings are optional, #853', function(t) {
  
  t.plan(2)

  var sql = raw('select * from ? where id=?', [raw('foo'), 4]).toSQL()

  t.equal(sql.sql, 'select * from foo where id=?')

  t.deepEqual(sql.bindings, [4])

})

test('array bindings', function(t) {

  var sql = raw('select ? as col', [[1,2]]).toString()

  t.equal(sql, 'select \'{"1","2"}\' as col')

})
