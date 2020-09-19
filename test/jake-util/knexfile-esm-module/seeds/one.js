/**
 * @param {import("../../../../")} knex
 */
export function seed(knex) {
  return knex('xyz').del();
}
