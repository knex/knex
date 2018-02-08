'use strict';

var Raw    = require('../../lib/raw');
var Client = require('../../lib/client')
var test   = require('tape')
var _      = require('lodash');

var client = new Client({client: 'mysql'})
function raw(sql, bindings) {
  return new Raw(client).set(sql, bindings)
}

test('allows for ?? to interpolate identifiers', function(t) {
  t.plan(1)
  t.equal(
    raw('select * from ?? where id = ? and ?? = ??', ['table', 1, 'table.first', 'table.second']).toString(),
    'select * from "table" where id = 1 and "table"."first" = "table"."second"'
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

test('allows use :val: in start of raw query', function(t) {
  t.plan(1)
  t.equal(
    raw(':userIdCol: = :userId', {userIdCol: 'table', userId: 1}).toString(),
    "\"table\" = 1"
  )
})

test('allows use :val in start of raw query', function(t) {
  t.plan(1)
  t.equal(
    raw(':userId', {userId: 1}).toString(),
    "1"
  )
})

test('allows for :val: to be interpolated when identifiers with dots', function(t) {
  t.plan(1)
  t.equal(
    raw('select * from "table" join "chair" on :tableCol: = :chairCol:', {tableCol: 'table.id', chairCol: 'chair.table_id'}).toString(),
    'select * from "table" join "chair" on "table"."id" = "chair"."table_id"'
  )
})

test('allows for options in raw queries, #605', function(t) {
  t.plan(1)
  var x = raw("select 'foo', 'bar';")
    .options({ rowMode: "array" })
    .toSQL()

  t.deepEqual(_.pick(x, ['sql', 'options', 'method', 'bindings']), {
    sql: "select 'foo', 'bar';",
    options: {rowMode: "array"},
    method: 'raw',
    bindings: []
  })
})

test('raw bindings are optional, #853', function(t) {

  t.plan(2)

  var sql = raw('select * from ? where id=?', [raw('foo'), 4]).toSQL()

  t.equal(sql.sql, 'select * from foo where id=?')

  t.deepEqual(sql.bindings, [4])

})

