var equal  = require('assert').equal;
var When   = require('when');
var _      = require('underscore');
var Knex   = require('../knex');
var conn   = require(process.env.KNEX_TEST || './shared/config');

// The output goes here.
exports.output = {};

var pool = {
  afterCreate: function(conn, done) {
    equal(_.has(conn, '__cid'), true);
    done();
  },
  beforeDestroy: function(conn, done) {
    equal(_.has(conn, '__cid'), true);
    done();
  }
};

Knex.Initialize({
  client: 'mysql',
  connection: conn.mysql,
  pool: _.extend({}, pool, {
    afterCreate: function(conn, done) {
      conn.query("SET sql_mode='TRADITIONAL';", [], function(err) {
        done(err);
      });
    }
  })
});
var Sqlite3 = Knex.Initialize('sqlite3', {
  client: 'sqlite3',
  connection: conn.sqlite3,
  pool: pool
});
var Postgres = Knex.Initialize('postgres', {
  client: 'postgres',
  connection: conn.postgres,
  pool: pool
});

var regularThen = Knex.Builder.prototype.then;
var then = function(success, error) {
  var ctx = this;
  var bindings = ctx._cleanBindings();
  var chain = regularThen.call(this, function(resp) {
    return {
      object: resp,
      string: {
        sql: ctx.sql,
        bindings: bindings
      }
    };
  });
  return chain.then(success, error);
};

describe('Knex', function() {

  _.each(['Builder', 'SchemaBuilder', 'Raw'], function(item) {
    Knex[item].prototype.then = then;
    Postgres[item].prototype.then = then;
    Sqlite3[item].prototype.then = then;
  });

  require('./regular')(Knex, 'mysql');
  require('./regular')(Postgres, 'postgres');
  require('./regular')(Sqlite3, 'sqlite3');

});