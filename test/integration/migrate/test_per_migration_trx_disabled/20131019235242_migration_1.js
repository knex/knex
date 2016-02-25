'use strict';

exports.up = function(knex) {
  return knex.schema
    .createTable('migration_test_trx_1', function(t) {
      t.increments();
      t.string('name');
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('migration_test_trx_1');
};
