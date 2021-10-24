'use strict';

exports.up = async function (knex) {
  await knex.table('test_transactions').update({ value: 1 });
  throw new Error('Up failed');
};

exports.down = async function () {};

exports.config = {
  transaction: false,
};
