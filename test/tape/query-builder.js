'use strict';

var tape = require('tape')
var QueryBuilder = require('../../lib/query/builder')

tape('accumulates multiple update calls #647', function(t) {
  t.plan(1)
  var qb = new QueryBuilder({})
  qb.update('a', 1).update('b', 2)
  t.deepEqual(qb._single.update, {a: 1, b: 2})
})
