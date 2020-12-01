/**
 * @param {import("../../../../")} knex
 */
export function up(knex) {
    return knex.schema.createTable('xyz', (table) => {
        table.string('name');
    });
}
/**
 * @param {import("../../../../")} knex
 */
export function down(knex) {
    return knex.schema.dropTable('xyz');
}
