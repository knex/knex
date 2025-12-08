exports.up = async (knex) => {
  await knex.schema.createTableIfNotExists('some_table', (table) => {
    table.increments();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('some_table');
};
