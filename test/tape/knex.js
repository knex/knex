'use strict';

var knex = require('../../lib/index');
var test = require('tape')

test('it should parse the connection string', function(t) {
  t.plan(1)
  var knexObj = knex({
    client: 'mysql',
    connection: "mysql://user:password@example.com/dbname"
  })
  t.deepEqual(knexObj.client.config.connection, {
    database: 'dbname',
    host: 'example.com',
    password: 'password',
    user: 'user'
  })
  knexObj.destroy()
})