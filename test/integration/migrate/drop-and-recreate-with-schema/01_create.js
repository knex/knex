exports.up = async (knex) => {
  await knex.raw('CREATE SCHEMA dummySchema');
  await knex.schema
    .withSchema('dummySchema')
    .createTable('old_users', (table) => {
      table.string('name');
      table.string('officeId');
    });
};

exports.down = async (knex) => {
  await knex.schema.withSchema('dummySchema').dropTable('old_users');
  await knex.raw('DROP SCHEMA dummySchema CASCADE');
};
