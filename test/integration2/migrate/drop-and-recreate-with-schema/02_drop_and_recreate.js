exports.up = (knex) => {
  return knex.schema
    .withSchema('dummy_schema')
    .table('old_users', function (table) {
      table.dropColumn('officeId');
    })
    .then(() => {
      return knex.schema
        .withSchema('dummy_schema')
        .table('old_users', function (table) {
          table.string('officeId', 255);
        });
    });
};

exports.down = (knex) => {};
