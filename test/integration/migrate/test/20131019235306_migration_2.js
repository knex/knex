'use strict';


exports.up = function(knex, promise) {
  return promise.all([
    knex.schema
      .createTable('migration_test_2', function(t) {
        t.increments();
        t.string('name');
      }),
      knex.schema
        .createTable('migration_test_2_1', function(t) {
          t.increments();
          t.string('name');
        })
  ]);
};

exports.down = function(knex, promise) {
  return promise.all([knex.schema.dropTable('migration_test_2'), knex.schema.dropTable('migration_test_2_1')]);
};