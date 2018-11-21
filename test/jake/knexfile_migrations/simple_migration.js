exports.up = (knex) => {
  return knex.schema.createTable('rules', (table) => {
    table.string('name');
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('rules');
};
