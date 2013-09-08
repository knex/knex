var When = require('when');
module.exports = function(Knex, resolver, error) {

  var res = null;

  return When.all([
    Knex.Schema.dropTableIfExists('test_foreign_table_two'),
    Knex.Schema.dropTableIfExists('test_table_one'),
    Knex.Schema.dropTableIfExists('test_table_two'),
    Knex.Schema.dropTableIfExists('test_table_three'),
    Knex.Schema.dropTableIfExists('datatype_test'),
    Knex.Schema.dropTableIfExists('accounts'),
    Knex.Schema.dropTableIfExists('test_default_table')
  ]).then(function(resp) {

    res = [resp[0]]; // only really need one of these for the test output.

    return When.all([
      Knex.Schema.createTable('test_table_one', function(table) {
        table.engine('InnoDB');
        table.comment('A table comment.');
        table.bigIncrements('id');
        table.string('first_name');
        table.string('last_name');
        table.string('email').unique().nullable();
        table.integer('logins').defaultTo(1).index().comment();
        table.text('about').comment('A comment.');
        table.timestamps();
      }),
      Knex.Schema.createTable('test_table_two', function(table) {
        table.engine('InnoDB');
        table.increments();
        table.integer('account_id');
        table.text('details');
        table.tinyint('status');
      }),
      Knex.Schema.createTable('test_table_three', function(table) {
        table.engine('InnoDB');
        table.integer('main').primary();
        table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
      }),
      Knex.Schema.createTable('datatype_test', function(table) {
        table.enum('enum_value', ['a', 'b', 'c']);
        table.uuid('uuid');
      }),
      Knex.Schema.createTable('test_foreign_table_two', function(table) {
        table.increments();
        table.integer('fkey_two')
          .unsigned()
          .references('id')
          .inTable('test_table_two');
      })
    ]);
  })
  .then(function(resp) {
    // Edit test table one
    res = res.concat(resp);
    return Knex.Schema.table('test_table_two', function(t) {
      t.json('json_data').nullable();
    }).then(function() {
      return Knex.Schema.table('test_table_one', function(t) {
        t.string('phone').nullable();
      });
    });
  }).then(function(resp) {
    // conditionally drops tables with `dropTableIfExists`
    res.push(resp);
    return Knex.Schema.dropTableIfExists('items');
  })
  .then(function(resp) {
    res.push(resp);
    return Knex.Schema.hasTable('test_table_two');
  })
  .then(function(resp) {
    res.push(resp);
    return Knex.Schema.renameTable('test_table_one', 'accounts');
  })
  .then(function(resp) {
    res.push(resp);
    return Knex.Schema.dropTable('test_table_three');
  })
  .then(function(resp) {
    res.push(resp);
    // Drop this here so we don't have foreign key constraints...
    return Knex.Schema.dropTable('test_foreign_table_two');
  })
  .then(function() {
    return Knex.Schema.createTable('test_default_table', function(qb) {
      qb.increments().primary();
      qb.string('string').defaultTo('hello');
      qb.tinyint('tinyint').defaultTo(0);
      qb.text('text').nullable();
    });
  })
  .tap(function() {
    return Knex.Schema.hasColumn('accounts', 'first_name');
  })
  .then(function() {
    return res;
  })
  .then(resolver, error);

};
