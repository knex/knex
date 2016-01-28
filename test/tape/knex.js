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

test('it should extend the knex instance and query builder to add a new method', function(t) {
  t.plan(1)
  var knexObj = knex({
    client: 'mysql',
    connection: "mysql://user:password@example.com/dbname"
  })
  knexObj.extend('paginate', function () {})
  var queryBuilder = knexObj.table('users')
  t.equal(typeof(queryBuilder.paginate), 'function')
  knexObj.destroy()
})

test('it should be able to call the method directly on the knex instance', function(t) {
  t.plan(1)
  var knexObj = knex({
    client: 'mysql',
    connection: "mysql://user:password@example.com/dbname"
  })
  knexObj.extend('paginate', function () {
    return 'called'
  })
  var response = knexObj.paginate()
  t.equal(response, 'called')
  knexObj.destroy()
})

test('it should get the query builder instance inside the extended method callback', function(t) {
  t.plan(1)
  var knexObj = knex({
    client: 'mysql',
    connection: "mysql://user:password@example.com/dbname"
  })
  knexObj.extend('paginate', function () {
    return this
  })
  var queryBuilder = knexObj.table('users')
  var result = queryBuilder.paginate()
  t.deepEqual(queryBuilder, result)
  knexObj.destroy()
})

test('it should be able to accept parameters when method is called', function(t) {
  t.plan(1)
  var knexObj = knex({
    client: 'mysql',
    connection: "mysql://user:password@example.com/dbname"
  })
  knexObj.extend('paginate', function (page, perPage) {
    return {page: page, perPage: perPage}
  })
  var result = knexObj.paginate(1, 10)
  t.deepEqual(result, {page: 1, perPage: 10})
  knexObj.destroy()
})