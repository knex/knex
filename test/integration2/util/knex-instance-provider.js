const { promisify } = require('util');
const knex = require('../../../lib');

const testConfig =
  (process.env.KNEX_TEST && require(process.env.KNEX_TEST)) || {};

const Db = /** @type {const} */ ({
  PostgresSQL: 'postgres',
  PgNative: 'pgnative',
  MySQL: 'mysql',
  MySQL2: 'mysql2',
  MSSQL: 'mssql',
  SQLite: 'sqlite3',
  Oracle: 'oracledb',
  CockroachDB: 'cockroachdb',
  BetterSqlite3: 'better-sqlite3',
});
/** @typedef {typeof Db[keyof typeof Db]} DriverName */
/** @typedef {import('../../../types/index').Knex} Knex*/

const defaultDbs = [
  Db.PostgresSQL,
  Db.PgNative,
  Db.MySQL,
  Db.MySQL2,
  Db.SQLite,
  Db.MSSQL,
  Db.CockroachDB,
  Db.BetterSqlite3,
];

function getAllDbs() {
  return process.env.DB ? process.env.DB.split(' ') : defaultDbs;
}

/**
 * Conditionally execute the callback with a configured instance of knex
 * for a subset of the available drivers, and only when those drivers are
 * included in the `DB` environment variable.
 *
 * @param {DriverName[]|'*'} dbNames The list of drivers for which the callback
 * should be executed.
 * @param {(knex: Knex, name: DriverName) => void} cb
 * @example
 * withDbs([Db.SQLite], (knex) => {
 *   describe('SQLite-specific tests', () => {
 *     // ...
 *   })
 * })
 */
function withDbs(dbNames, cb) {
  dbNames = dbNames === '*' ? Object.values(Db) : dbNames;

  const configuredDbs = getAllDbs();

  for (const name of dbNames) {
    if (!defaultDbs.includes(name)) {
      throw new Error(
        `Unknown db: ${name} (supported: ${Object.values(Db).join(', ')})`
      );
    }
    if (!configuredDbs.includes(name)) continue;
    const knex = getKnexForDb(name);
    cb(knex, name);
  }
}

const pool = {
  afterCreate: function (connection, callback) {
    callback(null, connection);
  },
};

const poolSqlite = {
  min: 0,
  max: 1,
  acquireTimeoutMillis: 1000,
  afterCreate: function (connection, callback) {
    connection.run('PRAGMA foreign_keys = ON', callback);
  },
};

const poolBetterSqlite = {
  min: 0,
  max: 1,
  acquireTimeoutMillis: 1000,
  afterCreate: function (connection, callback) {
    connection.prepare('PRAGMA foreign_keys = ON').run();
    callback(null, connection);
  },
};

const mysqlPool = Object.assign({}, pool, {
  afterCreate: function (connection, callback) {
    promisify(connection.query)
      .call(connection, "SET sql_mode='TRADITIONAL';", [])
      .then(function () {
        callback(null, connection);
      });
  },
});

const migrations = {
  directory: 'test/integration/migrate/migration',
};

const seeds = {
  directory: 'test/integration/seed/seeds',
};

const testConfigs = {
  mysql: {
    client: 'mysql',
    connection: testConfig.mysql || {
      port: 23306,
      database: 'knex_test',
      host: 'localhost',
      user: 'testuser',
      password: 'testpassword',
      charset: 'utf8',
    },
    pool: mysqlPool,
    migrations,
    seeds,
  },

  mysql2: {
    client: 'mysql2',
    connection: testConfig.mysql || {
      port: 23306,
      database: 'knex_test',
      host: 'localhost',
      user: 'testuser',
      password: 'testpassword',
      charset: 'utf8',
    },
    pool: mysqlPool,
    migrations,
    seeds,
  },

  postgres: {
    client: 'postgres',
    connection: testConfig.postgres || {
      adapter: 'postgresql',
      port: 25432,
      host: 'localhost',
      database: 'knex_test',
      user: 'testuser',
      password: 'knextest',
    },
    pool,
    migrations,
    seeds,
  },

  cockroachdb: {
    client: 'cockroachdb',
    connection: testConfig.cockroachdb || {
      adapter: 'cockroachdb',
      port: 26257,
      host: 'localhost',
      database: 'test',
      user: 'root',
      password: '',
    },
    pool,
    migrations,
    seeds,
  },

  pgnative: {
    client: Db.PgNative,
    connection: testConfig.pgnative || {
      adapter: 'postgresql',
      port: 25433,
      host: 'localhost',
      database: 'knex_test',
      user: 'testuser',
      password: 'knextest',
    },
    pool,
    migrations,
    seeds,
  },

  sqlite3: {
    client: 'sqlite3',
    connection: testConfig.sqlite3 || ':memory:',
    pool: poolSqlite,
    migrations,
    seeds,
    useNullAsDefault: false, // retain default behavior, silence warning
  },

  'better-sqlite3': {
    client: 'better-sqlite3',
    connection: testConfig.sqlite3 || ':memory:',
    pool: poolBetterSqlite,
    migrations,
    seeds,
    useNullAsDefault: false, // retain default behavior, silence warning
  },

  mssql: {
    client: 'mssql',
    connection: testConfig.mssql || {
      user: 'sa',
      password: 'S0meVeryHardPassword',
      server: 'localhost',
      port: 21433,
      database: 'knex_test',
      options: {
        mapBinding(value) {
          if (value && value.type) {
            return { value: value.value, type: value.type };
          }
        },
      },
    },
    pool: pool,
    migrations,
    seeds,
  },

  oracledb: {
    client: 'oracledb',
    connection: testConfig.oracledb || {
      user: 'system',
      password: 'Oracle18',
      connectString: 'localhost:21521/XE',
      // https://github.com/oracle/node-oracledb/issues/525
      stmtCacheSize: 0,
    },
    pool,
    migrations,
  },
};

function getDbTestConfig(db) {
  return testConfigs[db];
}

function getKnexForDb(db, configOverrides = {}) {
  const config = testConfigs[db];
  return knex({
    ...config,
    ...configOverrides,
  });
}

/** @returns {import('../../../types/index').Knex} */
function getKnexForSqlite(foreignKeys, configOverrides = {}) {
  const sql = `PRAGMA foreign_keys = ${foreignKeys ? 'ON' : 'OFF'}`;
  const config = {
    ...testConfigs.sqlite3,
    ...configOverrides,
  };
  config.pool = {
    ...config.pool,
    afterCreate: function (connection, callback) {
      connection.run(sql, callback);
    },
  };
  return knex(config);
}

/** @returns {import('../../../types/index').Knex} */
function getKnexForBetterSqlite(foreignKeys, configOverrides = {}) {
  const sql = `PRAGMA foreign_keys = ${foreignKeys ? 'ON' : 'OFF'}`;
  const config = {
    ...testConfigs.sqlite3,
    ...configOverrides,
  };
  config.pool = {
    ...config.pool,
    afterCreate: function (connection, callback) {
      connection.prepare(sql).run();
      callback(null, connection);
    },
  };
  return knex(config);
}

module.exports = {
  Db,
  getAllDbs,
  getKnexForDb,
  getKnexForSqlite,
  getKnexForBetterSqlite,
  withDbs,
  getDbTestConfig,
};
