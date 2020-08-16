function up(knex) {
  return knex.schema.createTable('xyz', (table) => {
    table.string('name');
  });
}
function down(knex) {
  return knex.schema.dropTable('xyz');
}
module.exports = { up, down }