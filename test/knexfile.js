'use strict';

var assert     = require('assert')
var testConfig = process.env.KNEX_TEST && require(process.env.KNEX_TEST) || {};
var _          = require('lodash');
var Promise    = require('bluebird');

// excluding redshift, oracle, and mssql dialects from default integrations test
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

  postgres: {
    dialect: 'postgres',
    connection: testConfig.postgres || {
      adapter:  "postgresql",
      database: "knex_test",
      user:     "postgres",
      password: "pass"
    },
    pool: pool,
    migrations: migrations,
    seeds: seeds,
  }
};

// export only copy the specified dialects
module.exports  = _.reduce(testIntegrationDialects, function (res, dialectName) {
  res[dialectName] = testConfigs[dialectName];
  return res;
}, {});
