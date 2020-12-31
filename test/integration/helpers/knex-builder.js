const knex = require('../../../knex');
const config = require('../../knexfile');

/*
Please do not remove this file even though it is not referenced anywhere.
This helper is meant for local debugging of specific tests.
 */

function getSqliteKnex() {
  return knex(config.sqlite3);
}

module.exports = {
  getSqliteKnex,
};
