'use strict';

exports.up = function(knex) {
  return knex.schema
    .createTable('should_not_be_run', function(t) {
      t.increments();
      t.string('name');
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('should_not_be_run');
};
