/**
 * @param {import("../../../../")} knex
 */
function up(knex) {
  return knex.schema.createTable('xyz', (table) => {
    table.string('name');
  });
}
/**
 * @param {import("../../../../")} knex
 */
function down(knex) {
  return knex.schema.dropTable('xyz');
}
module.exports = { up, down }