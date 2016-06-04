'use strict';

var tape  = require('tape')
var Migrator  = require('../../lib/migrate/index.js')

tape('migrate: constructor uses config.migrations', function(t) {
  t.plan(1)
  var migrator = new Migrator({client: {config: {migrations: {directory: '/some/dir'}}}})
  t.equal(migrator.config.directory, '/some/dir')
})

tape('migrate: setConfig() overrides configs given in constructor', function(t) {
  t.plan(1)
  var migrator = new Migrator({client: {config: {migrations: {directory: '/some/dir'}}}})

  var config = migrator.setConfig({directory: './custom/path'})

  t.equal(config.directory, './custom/path')
})

