'use strict';

exports.up = async function () {};

exports.down = async function (knex) {
  await knex.table('test_transactions').update({ value: -1 });
  throw new Error('Down failed');
};

exports.config = {
  transaction: false,
};
