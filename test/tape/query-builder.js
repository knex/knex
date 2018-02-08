'use strict';

var tape         = require('tape')
var omit         = require('lodash/omit')
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
  var qb = new QueryBuilder(new Client({client: 'mysql'}))
  var sql = qb.table('users').innerJoin('accounts', {
    'accounts.id': 'users.account_id',
    'accounts.owner_id': 'users.id'
  }).toSQL('join')
  t.equal(sql.sql,
    'inner join "accounts" on "accounts"."id" = "users"."account_id" and "accounts"."owner_id" = "users"."id"')
})

tape('clones correctly', function(t) {
  var qb = new QueryBuilder(new Client({client: 'mysql'}))
  var original = qb.table('users').debug().innerJoin('accounts', {
    'accounts.id': 'users.account_id',
    'accounts.owner_id': 'users.id'
  });

  var cloned = original.clone();

  t.notEqual(original, cloned);

  // `deepEqual` freezes when it encounters circular references,
  // so they must be omitted.
  t.deepEqual(
    omit(cloned, 'client', 'and'),
    omit(original, 'client', 'and')
  );

  t.equal(
    cloned.client,
    original.client,
    'clone references same client'
  );

  t.equal(cloned.and, cloned, 'cloned `and` references self');

  t.end();
});
