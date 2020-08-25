exports.up = function (knex) {
  return knex.schema.table('TestTableCreatedWithDBBrowser', function (table) {
    table.dropColumn('description');
  });
};

exports.down = function (knex) {
  return knex.schema.table('TestTableCreatedWithDBBrowser', function (table) {
    table.text('description');
  });
};
