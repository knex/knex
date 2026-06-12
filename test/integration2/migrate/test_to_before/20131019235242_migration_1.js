'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('migrate_to_test_1', function (t) {
    t.increments();
    t.string('name');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('migrate_to_test_1');
};
