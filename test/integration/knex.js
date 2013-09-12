var _      = require('underscore');
var Knex   = require('../../knex');
var nodefn = require('when/node/function');

var config = require(process.env.KNEX_TEST || './config');

var pool = {
  afterCreate: function(connection) {
    expect(connection).to.have.property('__cid');
  },
  beforeDestroy: function(connection) {
    expect(connection).to.have.property('__cid');
  }
};

var MySQL = Knex.initialize({
  client: 'mysql',
  connection: config.mysql,
  debug: true,
  pool: _.extend({}, pool, {
    afterCreate: function(connection) {
      return nodefn.call(connection.query.bind(connection), "SET sql_mode='TRADITIONAL';", []);
    }
  })
});

var PostgreSQL = Knex.initialize({
  client: 'postgres',
  connection: config.postgres,
  pool: pool
});

var SQLite3 = Knex.initialize({
  client: 'sqlite3',
  connection: config.sqlite3,
  pool: pool
});

_.each([MySQL, PostgreSQL, SQLite3], function(knex) {

  describe('Dialect: ' + knex.client.dialect, function() {

    require('./builder/schema')(knex);
    require('./builder/inserts')(knex);
    require('./builder/selects')(knex);
    require('./builder/unions')(knex);
    require('./builder/joins')(knex);
    require('./builder/aggregate')(knex);
    require('./builder/updates')(knex);
    require('./builder/transaction')(knex);
    require('./builder/deletes')(knex);
    require('./builder/additional')(knex);

  });

});