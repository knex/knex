exports.up = async (knex) => {
  await knex.schema.table('old_users', function (table) {
    table.dropColumn('officeId');
  });

  await knex.schema.table('old_users', function (table) {
    table.string('officeId', 255);
  });
};

exports.down = async (knex) => {};
