exports.up = async (knex) => {
  await knex.schema.createTable('old_users', (table) => {
    table.string('name');
    table.string('officeId');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('old_users');
};
