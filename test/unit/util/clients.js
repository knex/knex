const MySQL_Client = require('../../../lib/dialects/mysql');
const MySQL2_Client = require('../../../lib/dialects/mysql2');

const PG_Client = require('../../../lib/dialects/postgres');
const PgNative_Client = require('../../../lib/dialects/pgnative');
const CockroachDB_Client = require('../../../lib/dialects/cockroachdb');
const Redshift_Client = require('../../../lib/dialects/redshift');

const Oracledb_Client = require('../../../lib/dialects/oracledb');

const SQLite3_Client = require('../../../lib/dialects/sqlite3');
const BetterSqlite3_Client = require('../../../lib/dialects/better-sqlite3');

const MSSQL_Client = require('../../../lib/dialects/mssql');

const ctors = /** @type {const} */ ([
  MySQL_Client,
  MySQL2_Client,
  PG_Client,
  PgNative_Client,
  CockroachDB_Client,
  Redshift_Client,
  Oracledb_Client,
  SQLite3_Client,
  BetterSqlite3_Client,
  MSSQL_Client,
]);

/**
 * @typedef {ctors[number]} ClientCtor
 * @typedef {InstanceType<ClientCtor>} Client
 * @typedef {'mssql'|'mysql'|'oracle'|'postgresql'|'redshift'|'sqlite3'} DialectName
 */

/**
 * @template T
 * @typedef {(ctor: ClientCtor, dialect: string, driverName: string) => T} Factory
 * @param {Factory} factory
 * @generator
 * @yields {T}
 */
function* getAllClients(factory) {
  for (const ctor of ctors) {
    yield factory(ctor, ctor.prototype.dialect, ctor.prototype.driverName);
  }
}

module.exports = { getAllClients };
