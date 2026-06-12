exports.up = function (knex) {
  return knex.schema.table('TestTableCreatedWithDBBrowser', function (table) {
    table.renameColumn('id', 'testId');
  });
};

exports.down = function (knex) {
  return knex.schema.table('TestTableCreatedWithDBBrowser', function (table) {
    table.renameColumn('testId', 'id');
  });
};
