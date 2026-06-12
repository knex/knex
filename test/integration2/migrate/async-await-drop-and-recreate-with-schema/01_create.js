exports.up = async (knex) => {
  await knex.raw('CREATE SCHEMA dummy_schema');
  await knex.schema
    .withSchema('dummy_schema')
    .createTable('old_users', (table) => {
      table.string('name');
      table.string('officeId');
    });
};

exports.down = async (knex) => {
  await knex.schema.withSchema('dummy_schema').dropTable('old_users');
  await knex.raw('DROP SCHEMA dummy_schema CASCADE');
};
