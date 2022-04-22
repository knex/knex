exports.up = (knex) => {
  return knex.raw('CREATE SCHEMA dummy_schema').then(() => {
    return knex.schema
      .withSchema('dummy_schema')
      .createTable('old_users', (table) => {
        table.string('name');
        table.string('officeId');
      });
  });
};

exports.down = (knex) => {
  return knex.schema
    .withSchema('dummy_schema')
    .dropTable('old_users')
    .then(() => {
      return knex.raw('DROP SCHEMA dummy_schema CASCADE');
    });
};
