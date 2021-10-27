'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('test_transactions', (table) => {
    table.increments('id');
    table.integer('value').notNullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('test_transactions');
};
