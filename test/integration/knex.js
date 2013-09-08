var _      = require('underscore');
var Knex   = require('../../knex');

var config = require(process.env.KNEX_TEST || './config');

var pool = {
  afterCreate: function(connection, done) {
    expect(connection).to.have.property('__cid');
    done();
  },
  beforeDestroy: function(connection, done) {
    expect(connection).to.have.property('__cid');
    done();
  }
};

var MySQL = Knex.initialize({
  client: 'mysql',
  connection: config.mysql,
  pool: _.extend({}, pool, {
    afterCreate: function(conn, done) {
      conn.query("SET sql_mode='TRADITIONAL';", [], function(err) {
        done(err);
      });
    }
  })
});

var SQLite3 = Knex.initialize({
  client: 'sqlite3',
  connection: config.sqlite3,
  pool: pool
});

var PostgreSQL = Knex.initialize({
  client: 'postgres',
  connection: config.postgres,
  pool: pool
});

_.each([MySQL, SQLite3, PostgreSQL], function(knex) {

  describe('Dialect: ' + knex.client.dialect, function() {

    require('./builder/schema')(knex);
    require('./builder/inserts')(knex);
    require('./builder/selects')(knex);
    require('./builder/updates')(knex);
    require('./builder/deletes')(knex);

  });

});

