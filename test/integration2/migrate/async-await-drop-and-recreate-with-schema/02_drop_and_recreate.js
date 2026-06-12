exports.up = async (knex) => {
  await knex.schema
    .withSchema('dummy_schema')
    .table('old_users', function (table) {
      table.dropColumn('officeId');
    });

  await knex.schema
    .withSchema('dummy_schema')
    .table('old_users', function (table) {
      table.string('officeId', 255);
    });
};

exports.down = async (knex) => {};
