'use strict';

exports.up = function (knex) {
  return knex.schema
    .createTable('migration_test_4', function (t) {
      t.increments();
      t.string('name');
    })
    .then(() =>
      knex.schema.createTable('migration_test_4_1', function (t) {
        t.increments();
        t.string('name');
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('migration_test_4')
    .then(() => knex.schema.dropTable('migration_test_4_1'));
};
