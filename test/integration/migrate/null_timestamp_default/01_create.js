exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('null_date', function(t) {
      t.increments('id').primary();
      t.timestamp('deleted_at')
        .nullable()
        .defaultTo(null);
    }),
  ]);
};

exports.down = (knex) => {
  return knex.schema.dropTable('null_date');
};
