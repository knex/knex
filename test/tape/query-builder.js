'use strict';

var tape         = require('tape')
var QueryBuilder = require('../../lib/query/builder')
var Client       = require('../../lib/client')

tape('accumulates multiple update calls #647', function(t) {
  t.plan(1)
  var qb = new QueryBuilder({})
  qb.update('a', 1).update('b', 2)
  t.deepEqual(qb._single.update, {a: 1, b: 2})
})

tape('allows for object syntax in join', function(t) {
  t.plan(1)
  var qb = new QueryBuilder(new Client())
  var sql = qb.table('users').innerJoin('accounts', {
    'accounts.id': 'users.account_id',
    'accounts.owner_id': 'users.id'
  }).toSQL('join')
  t.equal(sql.sql, 
    'inner join "accounts" on "accounts"."id" = "users"."account_id" and "accounts"."owner_id" = "users"."id"')
})