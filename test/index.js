var Q      = require('q');
var _      = require('underscore');
var Knex   = require('../knex');
var conn   = require(process.env.KNEX_TEST || './shared/config');

// The output goes here.
exports.output = {};

var MySql  = Knex.Initialize('mysql', {
  client: 'mysql',
  connection: conn.mysql
});
var Sqlite3 = Knex.Initialize('sqlite3', {
  client: 'sqlite3',
  connection: conn.sqlite3
});
var Postgres = Knex.Initialize('postgres', {
  client: 'postgres',
  connection: conn.postgres
});

var runQuery = Knex.runQuery;
Knex.runQuery = function(builder) {
  if (builder.transaction) {
    if (!builder.transaction.connection) return Q.reject(new Error('The transaction has already completed.'));
    builder._connection = builder.transaction.connection;
  }
  // Query on the query builder, which should resolve with a promise.
  return Q({
    sql: builder.toSql(),
    bindings: builder.bindings
  });
};

describe('Knex', function() {

  var allDone;

  Q.all([
    require('./string')(MySql, 'mysql'),
    require('./string')(Postgres, 'postgres'),
    require('./string')(Sqlite3, 'sqlite3')
  ]).then(function() {
    Knex.runQuery = runQuery;
    return Q.all([
      require('./regular')(MySql, 'mysql'),
      require('./regular')(Postgres, 'postgres'),
      require('./regular')(Sqlite3, 'sqlite3')
    ]);
  }).then(function() {
    allDone();
  }, allDone);

  after(function(ok) {
    allDone = ok;
  });

});