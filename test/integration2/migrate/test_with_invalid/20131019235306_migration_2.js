'use strict';

exports.up = function (knex, promise) {
  return knex.schema
    .createTable('migration_test_2', function (t) {
      t.increments();
      t.string('name');
    })
    .then(() =>
      knex.schema.createTable('migration_test_2_1', function (t) {
        t.increments();
        t.string('name');
      })
    );
};

exports.down = function (knex, promise) {
  return knex.schema
    .dropTable('migration_test_2')
    .then(() => knex.schema.dropTable('migration_test_2_1'));
};
