'use strict';

var tape     = require('tape')
var makeKnex = require('../../knex')
var knexfile = require('../knexfile')

Object.keys(knexfile).forEach(function(key) {

  if (key === 'sqlite3') {
    return
  }

  require('./parse-connection')
  require('./raw')
  require('./query-builder')
  require('./seed')
  require('./migrate')
  require('./pool')
  require('./knex')

  var knex = makeKnex(knexfile[key])

  require('./transactions')(knex)
  require('./stream')(knex)

  // Tear down the knex connection
  tape(knex.client.driverName + ' - transactions: after', function(t) {
    knex.destroy().then(function() {
      t.ok(true, 'Knex client destroyed')
      t.end()
    })
  })

})
