const { get } = require('lodash');
const { DRIVER_NAMES: drivers } = require('../../lib/constants');

function getDriverName(knex) {
  return get(knex, 'client.driverName', '');
}

function isPostgreSQL(knex) {
  return isOneOfDbs(knex, [drivers.PostgreSQL, drivers.PgNative]);
}

function isPgNative(knex) {
  return getDriverName(knex) === drivers.PgNative;
}

function isPgBased(knex) {
  return isOneOfDbs(knex, [
    drivers.PostgreSQL,
    drivers.PgNative,
    drivers.Redshift,
    drivers.CockroachDB,
  ]);
}

function isPgBasedDriverName(driverName) {
  return [
    drivers.PostgreSQL,
    drivers.PgNative,
    drivers.Redshift,
    drivers.CockroachDB,
  ].includes(driverName);
}

function isPgDriverName(driverName) {
  return [drivers.PostgreSQL, drivers.PgNative].includes(driverName);
}

function isMssql(knex) {
  return getDriverName(knex) === drivers.MsSQL;
}

function isOracle(knex) {
  return getDriverName(knex) === drivers.Oracle;
}

function isMysql(knex) {
  return isOneOfDbs(knex, [drivers.MySQL, drivers.MySQL2]);
}

function isRedshift(knex) {
  return getDriverName(knex) === drivers.Redshift;
}

function isSQLite(knex) {
  return getDriverName(knex) === drivers.SQLite || isBetterSQLite3(knex);
}

function isCockroachDB(knex) {
  return getDriverName(knex) === drivers.CockroachDB;
}

function isBetterSQLite3(knex) {
  return getDriverName(knex) === drivers.BetterSQLite3;
}
/**
 *
 * @param knex
 * @param {('pg'|'pgnative'|'pg-redshift'|'oracledb'|'mysql'|'mysql2'|'mssql'|'sqlite3'|'cockroachdb'|'better-sqlite3')[]} supportedDbs - supported DB values in DRIVER_NAMES from lib/constants.
 * @returns {*}
 */
function isOneOfDbs(knex, supportedDbs) {
  return supportedDbs.includes(getDriverName(knex));
}

module.exports = {
  getDriverName,
  isOneOfDbs,
  isCockroachDB,
  isMysql,
  isMssql,
  isOracle,
  isPostgreSQL,
  isPgNative,
  isPgDriverName,
  isPgBased,
  isPgBasedDriverName,
  isRedshift,
  isSQLite,
  isBetterSQLite3,
};
