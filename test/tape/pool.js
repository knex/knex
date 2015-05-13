'use strict';

var test   = require('tape')
var Client = require('../../lib/client');

test('#822, pool config, max: 0 should skip pool construction', function(t) {
  t.plan(1)

  var client = new Client({pool: {max: 0}})

  t.equal(client.pool, undefined)

})