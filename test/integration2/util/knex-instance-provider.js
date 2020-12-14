const { promisify } = require('util');
const knex = require('../../../lib');

const Db = {
  PostgresSQL: 'postgres',
  MySQL: 'mysql',
  MySQL2: 'mysql2',
  MSSQL: 'mssql',
  SQLite: 'sqlite3',
  Oracle: 'oracledb',
};

const defaultDbs = [Db.PostgresSQL, Db.MySQL, Db.MySQL2, Db.SQLite, Db.MSSQL];

function getAllDbs() {
  return process.env.DB ? process.env.DB.split(' ') : defaultDbs;
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
    connection: {
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
    connection: {
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
    connection: {
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

  sqlite3: {
    client: 'sqlite3',
    connection: ':memory:',
    pool: poolSqlite,
    migrations,
    seeds,
  },

  mssql: {
    client: 'mssql',
    connection: {
      user: 'sa',
      password: 'S0meVeryHardPassword',
      server: 'localhost',
      port: 21433,
      database: 'knex_test',
    },
    pool: pool,
    migrations,
    seeds,
  },

  oracledb: {
    client: 'oracledb',
    connection: {
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

function getKnexForDb(db) {
  const config = testConfigs[db];
  return knex(config);
}

module.exports = {
  Db,
  getAllDbs,
  getKnexForDb,
};
