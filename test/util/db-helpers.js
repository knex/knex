function isPostgreSQL(knex) {
  return knex.client.driverName === 'pg';
}

function isMssql(knex) {
  return knex.client.driverName === 'mssql';
}

function isOracle(knex) {
  return /oracle/i.test(knex.client.driverName);
}

function isMysql(knex) {
  return /mysql/i.test(knex.client.driverName);
}

function isRedshift(knex) {
  return knex.client.driverName === 'redshift';
}

function isSQLite(knex) {
  return knex.client.driverName === 'sqlite3';
}

/**
 *
 * @param knex
 * @param {('pg'|'oracledb'|'mysql'|'mysql2'|'mssql'|'sqlite3')[]} supportedDbs - supported DB values
 * @returns {*}
 */
function isOneOfDbs(knex, supportedDbs) {
  return supportedDbs.includes(knex.client.driverName);
}

module.exports = {
  isOneOfDbs,
  isMysql,
  isMssql,
  isOracle,
  isPostgreSQL,
  isRedshift,
  isSQLite,
};
