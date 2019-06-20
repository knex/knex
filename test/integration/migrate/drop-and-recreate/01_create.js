exports.up = (knex) => {
  return knex.schema.createTable('old_users', (table) => {
    table.string('name');
    table.string('officeId');
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('old_users');
};
