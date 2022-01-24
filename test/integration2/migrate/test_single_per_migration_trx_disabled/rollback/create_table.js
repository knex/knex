'use strict';

exports.up = async function (knex) {};

exports.down = async function (knex) {
  await knex.schema.dropTable('test_transactions');
};
