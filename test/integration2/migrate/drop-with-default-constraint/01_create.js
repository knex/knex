exports.up = (knex) => {
  return knex.schema.createTable('drop_with_default_constraint', (table) => {
    table.integer('foo').notNullable().defaultTo(0);
    table.string('bar').nullable();
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('drop_with_default_constraint');
};
