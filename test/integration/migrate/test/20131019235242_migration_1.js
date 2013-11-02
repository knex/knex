
exports.up = function(knex, promise) {
  return knex.schema.createTable('migration_test_1', function(t) {
    t.increments();
    t.string('name');
  });
};

exports.down = function(knex, promsie) {
  return knex.schema.dropTable('migration_test_1');
};