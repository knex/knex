'use strict';

exports.up = function(knex) {
  return knex.schema.table('migration_test_1', function (table) {
      table.string('transaction');
    }).raw('SELECT foo FROM unknown_table');
};

exports.down = function() {

};
