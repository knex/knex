exports.up = (knex) => {
  return knex.schema.createTable('two', (table) => {
    table.string('name');
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('two');
};
