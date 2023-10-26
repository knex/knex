exports.up = (knex) => {
  return knex.schema.alterTable('drop_with_default_constraint', (table) => {
    table.dropColumn('foo');
  });
};

exports.down = (knex) => {
  return knex.schema.alterTable('drop_with_default_constraint', (table) => {
    table.integer('foo').notNullable().default(0);
  });
};
