'use strict';

var tape  = require('tape')
var Seed  = require('../../lib/seed/index.js')

tape('checks config.seeds for seed config', function(t) {
  t.plan(1)
  var seeder = new Seed({client: {config: {seeds: {directory: '/some/dir'}}}})
  t.equal(seeder.config.directory, '/some/dir')
})
