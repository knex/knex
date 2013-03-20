
# Mock tests
assert = require('assert')

Knex = require('../knex')
Q = require('q')
_ = require('underscore')

Knex.Initialize
  client: 'mysql'

originalQuery = Knex.client.query
Knex.client.query = (querystring, bindings, callback, connection) ->
  callback(null, [querystring, bindings, connection])

describe 'Knex Schema Builder', ->

  it 'creates new tables', (done) ->
    Knex.Schema.createTable 'table', (table) ->
      table.increments('id')
      table.string('first_name').nullable()
      table.string('last_name')
      table.integer('logins').defaultTo(1).index()
      table.text('about').defaultTo('My Bio.')
      table.timestamps()
    .then ->
      # console.log(arguments)
      done()

describe 'Knex Selects', ->

  describe 'basic', ->
    
    it 'runs with no conditions', (done) ->
      Knex('tableName').select().spread (sql, bindings, connection) ->
        assert.equal(sql, 'select * from `tableName`')
        assert.deepEqual(bindings, [])
        done()

  describe 'where', ->
  
    it 'handles simple "where"', (done) ->
      Knex('table').where('id', 1).select('column1', 'column2')
      .spread (sql, bindings) ->
        assert.equal(sql, 'select `column1`, `column2` from `table` where `id` = ?')
        assert.deepEqual(bindings, [1])
        Knex('table').where('id', '=', 'someValue').select(['column1', 'column2'])
      .spread (sql, bindings) ->
        assert.equal(sql, 'select `column1`, `column2` from `table` where `id` = ?')
        assert.deepEqual(bindings, ['someValue'])
        Knex('table').where({id: 1, otherItem: 2}).andWhere('title', 'test').select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` = ? and `otherItem` = ? and `title` = ?')
        assert.deepEqual(bindings, [1, 2, 'test'])
        done()

    it 'handles "or where"', (done) ->
      Knex('table').where('id', 1).orWhere({id: 2}).select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` = ? or `id` = ?')
        assert.deepEqual(bindings, [1, 2])
        Knex('table').where('id', '=', 'someValue').orWhere('otherId', '>', 10).select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` = ? or `otherId` > ?')
        assert.deepEqual(bindings, ['someValue', 10])
        done()
      
    it 'handles "where exists"', (done) ->
      Knex('table').whereExists (qb) ->
        assert.deepEqual(qb, this)
        qb.select('column1').from('table2').where({id: 1, otherItem: 2})
      .select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where exists (select `column1` from `table2` where `id` = ? and `otherItem` = ?)')
        assert.deepEqual(bindings, [1, 2])
        done()

    it 'handles "where in"', (done) ->
      Knex('table').whereIn('id', [1, 2, 3]).select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` in (?, ?, ?)')
        assert.deepEqual(bindings, [1, 2, 3])
        done()

    it 'handles "or where in"', (done) ->
      Knex('table').where('id', 1).orWhereIn('name', ['Tim', 'Joe', 'Bill']).select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` = ? or `name` in (?, ?, ?)')
        assert.deepEqual(bindings, [1, 'Tim', 'Joe', 'Bill'])
        done()

    it 'handles "where between"', (done) ->
      Knex('table').whereBetween('id', [1, 100]).select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` between ? and ?')
        assert.deepEqual(bindings, [1, 100])
        done()

    it 'handles "or where between"', (done) ->
      Knex('table').whereBetween('id', [1, 100]).orWhereBetween('id', [200, 300])
      .select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `table` where `id` between ? and ? or `id` between ? and ?')
        assert.deepEqual(bindings, [1, 100, 200, 300])
        done()

  describe 'joins', ->

    it 'uses inner join by default', (done) ->
      Knex('tableName')
        .join('otherTable', 'tableName.id', '=', 'otherTable.otherId')
        .select('tableName.*', 'otherTable.name')
      .spread (sql, bindings) ->
        assert.equal(sql, 'select `tableName`.*, `otherTable`.`name` from `tableName` inner join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`')
        done()

    it 'takes a fifth parameter to specify the join type', (done) ->
      Knex('tableName')
        .join('otherTable', 'tableName.id', '=', 'otherTable.otherId', 'left')
        .select('tableName.*', 'otherTable.name')
      .spread (sql, bindings) ->
        assert.equal(sql, 'select `tableName`.*, `otherTable`.`name` from `tableName` left join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`')
        done()

    it 'accepts a callback as the second argument for advanced joins', (done) ->
      Knex('tableName')
        .join('table2', (join) ->
          join.on('tableName.one_id', '=', 'table2.tableName_id')
          join.orOn('tableName.other_id', '=', 'table2.tableName_id2')
        , 'left')
        .select()
      .spread (sql, bindings) ->
        assert.equal(sql, 'select * from `tableName` left join `table2` on `tableName`.`one_id` = `table2`.`tableName_id` or `tableName`.`other_id` = `table2`.`tableName_id2`')
        done()

