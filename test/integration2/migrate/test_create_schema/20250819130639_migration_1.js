'use strict';

exports.up = function (knex) {
  return knex.schema.withSchema('test_create_schema').createTable('migration_test_1', function (t) {
    t.increments();
    t.string('name');
  });
};

exports.down = function (knex) {
  return knex.schema.withSchema('test_create_schema').dropTable('migration_test_1');
};
