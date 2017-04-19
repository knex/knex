'use strict';

var assert     = require('assert')
var testConfig = process.env.KNEX_TEST && require(process.env.KNEX_TEST) || {};
var _          = require('lodash');
var Promise    = require('bluebird');

// excluding oracle and mssql dialects from default integrations test
var testIntegrationDialects = (process.env.DB || "maria mysql mysql2 postgres sqlite3").match(/\w+/g);

var pool = {
  afterCreate: function(connection, callback) {
    assert.ok(typeof connection.__knexUid !== 'undefined')
    callback(null, connection);
  }
};

var mysqlPool = _.extend({}, pool, {
  afterCreate: function(connection, callback) {
    Promise.promisify(connection.query, {context: connection})("SET sql_mode='TRADITIONAL';", []).then(function() {
      callback(null, connection);
    });
  }
});

var mariaPool = _.extend({}, pool, {
  afterCreate: function(connection, callback) {
    var query = connection.query("SET sql_mode='TRADITIONAL';", [])
    query.on('result', function(result) {
      result.on('end', function() {
        callback(null, connection)
      })
    })
  }
});

var migrations = {
  directory: 'test/integration/migrate/migration'
};

var seeds = {
  directory: 'test/integration/seed/seeds'
};

var testConfigs = {

  maria: {
    dialect: 'maria',
    connection: testConfig.maria || {
      db: "knex_test",
      user: "root",
      charset: 'utf8',
      host: '127.0.0.1'
    },
    pool: mariaPool,
    migrations: migrations,
    seeds: seeds
  },

  mysql: {
    dialect: 'mysql',
    connection: testConfig.mysql || {
      database: "knex_test",
      user: "root",
      charset: 'utf8'
    },
    pool: mysqlPool,
    migrations: migrations,
    seeds: seeds,
    docker: {
      factory:   './mysql/index.js',
      container: 'knex-test-mysql',
      image:     'mysql:5.7',
      database:  'mysql',
      username:  'root',
      password:  'root',
      hostPort:  '49153',
      client:    'mysql',
      timeout:   60 * 1000
    }
  },

  mysql2: {
    dialect: 'mysql2',
    connection: testConfig.mysql || {
      database: "knex_test",
      user: "root",
      charset: 'utf8'
    },
    pool: mysqlPool,
    migrations: migrations,
    seeds: seeds
  },

  oracle: {
    client: 'strong-oracle',
    connection: testConfig.oracle || {
      adapter:  "oracle",
      database: "knex_test",
      user:     "oracle"
    },
    pool: pool,
    migrations: migrations
  },

  oracledb: {
    client: 'oracledb',
    connection: testConfig.oracledb || {
      user          : "travis",
      password      : "travis",
      connectString : "localhost/XE",
      // https://github.com/oracle/node-oracledb/issues/525
      stmtCacheSize : 0
    },
    pool: pool,
    migrations: migrations
  },

  postgres: {
    dialect: 'postgres',
    connection: testConfig.postgres || {
      adapter:  "postgresql",
      database: "knex_test",
      user:     "postgres"
    },
    pool: pool,
    migrations: migrations,
    seeds: seeds,
    docker: {
      factory:   './postgres/index.js',
      container: 'knex-test-postgres',
      image:     'postgres:9.6',
      database:  'postgres',
      username:  'postgres',
      password:  '',
      hostPort:  '49152',
      client:    'pg',
      timeout:   10 * 1000
    }
  },

  sqlite3: {
    dialect: 'sqlite3',
    connection: testConfig.sqlite3 || {
      filename: __dirname + '/test.sqlite3'
    },
    pool: pool,
    migrations: migrations,
    seeds: seeds
  },

  mssql: {
    dialect: 'mssql',
    connection: testConfig.mssql || {
      user: "knex_test",
      password: "knex_test",
      server: "127.0.0.1",
      database: "knex_test"
    },
    pool: pool,
    migrations: migrations,
    seeds: seeds
  }
};

// export only copy the specified dialects
module.exports  = _.reduce(testIntegrationDialects, function (res, dialectName) {
  res[dialectName] = testConfigs[dialectName];
  return res;
}, {});
