/*global expect*/

'use strict';

var testConfig = process.env.KNEX_TEST && require(process.env.KNEX_TEST) || {};
var _          = require('lodash');
var Promise    = require('bluebird');

// excluding oracle and maria dialects from default integrations test
var testIntegrationDialects = (process.env.KNEX_TEST_INTEGRATION_DIALECTS || "mysql mysql2 postgres sqlite3").match(/\w+/g);

var pool = {
  afterCreate: function(connection, callback) {
    expect(connection).to.have.property('__cid');
    callback(null, connection);
  },
  beforeDestroy: function(connection, continueFunc) {
    expect(connection).to.have.property('__cid');
    continueFunc();
  }
};

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
      charset: 'utf8'
    },
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
    pool: _.extend({}, pool, {
      afterCreate: function(connection, callback) {
        Promise.promisify(connection.query, connection)("SET sql_mode='TRADITIONAL';", []).then(function() {
          callback(null, connection);
        });
      }
    }),
    migrations: migrations,
    seeds: seeds
  },

  mysql2: {
    dialect: 'mysql2',
    connection: testConfig.mysql || {
      database: "knex_test",
      user: "root",
      charset: 'utf8'
    },
    pool: _.extend({}, pool, {
      afterCreate: function(connection, callback) {
        Promise.promisify(connection.query, connection)("SET sql_mode='TRADITIONAL';", []).then(function() {
          callback(null, connection);
        });
      }
    }),
    migrations: migrations,
    seeds: seeds
  },

  oracle: {
    dialect: 'oracle',
    connection: testConfig.oracle || {
      adapter:  "oracle",
      database: "knex_test",
      user:     "oracle"
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
    seeds: seeds
  },

  sqlite3: {
    dialect: 'sqlite3',
    connection: {
      filename: __dirname + '/test.sqlite3'
    },
    pool: _.extend({}, pool, {
      max: 2
    }),
    migrations: migrations,
    seeds: seeds
  }
};

// export only copy the specified dialects
module.exports  = _.reduce(testIntegrationDialects, function (res, dialectName) {
  res[dialectName] = testConfigs[dialectName];
  return res;
}, {});
