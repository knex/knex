exports.up = (knex) => {
  return knex.schema.createTable('one', (table) => {
    table.string('name');
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('one');
};
