var when = require('when');

module.exports = function(knex) {

  before(function() {
    return when.all([
      knex.schema.dropTableIfExists('test_foreign_table_two'),
      knex.schema.dropTableIfExists('test_table_one'),
      knex.schema.dropTableIfExists('test_table_two'),
      knex.schema.dropTableIfExists('test_table_three'),
      knex.schema.dropTableIfExists('datatype_test'),
      knex.schema.dropTableIfExists('accounts'),
      knex.schema.dropTableIfExists('test_default_table')
    ]);
  });

  describe('createTable', function() {

    it('accepts the table name, and a "container" function', function() {

      return when.all([
        knex.schema.createTable('test_table_one', function(table) {
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
        knex.schema.createTable('test_table_three', function(table) {
          table.engine('InnoDB');
          table.integer('main').primary();
          table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
        }),
        knex.schema.createTable('datatype_test', function(table) {
          table.enum('enum_value', ['a', 'b', 'c']);
          table.uuid('uuid');
        }),
        knex.schema.createTable('test_foreign_table_two', function(table) {
          table.increments();
          table.integer('fkey_two')
            .unsigned()
            .references('id')
            .inTable('test_table_two');
        })
      ]);

    });

    // it('', function() {

    // });

  });

  // .then(function(resp) {
  //   // Edit test table one
  //   res = res.concat(resp);
  //   return knex.schema.table('test_table_two', function(t) {
  //     t.json('json_data').nullable();
  //   }).then(function() {
  //     return knex.schema.table('test_table_one', function(t) {
  //       t.string('phone').nullable();
  //     });
  //   });
  // }).then(function(resp) {
  //   // conditionally drops tables with `dropTableIfExists`
  //   res.push(resp);
  //   return knex.schema.dropTableIfExists('items');
  // })
  // .then(function(resp) {
  //   res.push(resp);
  //   return knex.schema.hasTable('test_table_two');
  // })
  // .then(function(resp) {
  //   res.push(resp);
  //   return knex.schema.renameTable('test_table_one', 'accounts');
  // })
  // .then(function(resp) {
  //   res.push(resp);
  //   return knex.schema.dropTable('test_table_three');
  // })
  // .then(function(resp) {
  //   res.push(resp);
  //   // Drop this here so we don't have foreign key constraints...
  //   return knex.schema.dropTable('test_foreign_table_two');
  // })
  // .then(function() {
  //   return knex.schema.createTable('test_default_table', function(qb) {
  //     qb.increments().primary();
  //     qb.string('string').defaultTo('hello');
  //     qb.tinyint('tinyint').defaultTo(0);
  //     qb.text('text').nullable();
  //   });
  // })
  // .tap(function() {
  //   return knex.schema.hasColumn('accounts', 'first_name');
  // })
  // .then(function() {
  //   return res;
  // })
  // .then(resolver, error);

};
