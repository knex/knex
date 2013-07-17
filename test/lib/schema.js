var When = require('when');
module.exports = function(Knex, resolver, error) {

  var res = null;

  return When.all([
    Knex.Schema.dropTableIfExists('test_foreign_table_two'),
    Knex.Schema.dropTableIfExists('test_table_one'),
    Knex.Schema.dropTableIfExists('test_table_two'),
    Knex.Schema.dropTableIfExists('test_table_three'),
    Knex.Schema.dropTableIfExists('datatype_test'),
    Knex.Schema.dropTableIfExists('accounts')
  ]).then(function(resp) {

    res = [resp[0]]; // only really need one of these for the test output.

    return When.all([
      Knex.Schema.createTable('test_table_one', function(table) {
        table.engine('InnoDB');
        table.comment('A table comment.');
        table.increments('id');
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
        table.json('json_data').nullable();
      }),
      Knex.Schema.createTable('test_table_three', function(table) {
        table.engine('InnoDB');
        table.integer('main').primary();
        table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
      }),
      Knex.Schema.createTable('datatype_test', function(table) {
        table.increments();
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
    return Knex.Schema.table('test_table_one', function(t) {
      t.string('phone').nullable();
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
    return res;
  })
  .then(resolver, error);

};
