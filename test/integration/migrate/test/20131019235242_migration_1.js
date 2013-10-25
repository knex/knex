
exports.up = function(knex, when) {
  return knex.schema.createTable('migration_test_1', function(t) {
    t.increments();
    t.string('name');
  });
};

exports.down = function(knex, when) {
  return knex.schema.dropTable('migration_test_1');
};