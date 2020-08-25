module.exports = {
  migration_source_test_1: {
    up(knex) {
      return knex.schema.createTable('migration_source_test_1', function (t) {
        t.increments();
        t.string('name');
      });
    },
    down(knex) {
      return knex.schema.dropTable('migration_source_test_1');
    },
  },
};
