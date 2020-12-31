exports.up = function (knex, Promise) {
  return knex.schema.createTable('null_date', function (t) {
    t.increments('id').primary();
    t.string('dummy');
    t.timestamp('deleted_at').nullable().defaultTo(null);
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('null_date');
};
