'use strict';

exports.up = function(knex, promise) {
  const tableName2 = knex.userParams.customTableName || 'migration_test_2_1';
  return knex.schema
    .createTable('migration_test_2', function(t) {
      t.increments();
      t.string('name');
    })
    .then(() =>
      knex.schema.createTable(tableName2, function(t) {
        t.increments();
        t.string('name');
      })
    );
};

exports.down = function(knex, promise) {
  const tableName2 = knex.userParams.customTableName || 'migration_test_2_1';
  return knex.schema
    .dropTable('migration_test_2')
    .then(() => knex.schema.dropTable(tableName2));
};
