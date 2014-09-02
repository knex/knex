'use strict';

exports.seed = function(knex) {
  knex('tableName').insert({colName: 'rowValue'});
};
