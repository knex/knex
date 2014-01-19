var _       = require('lodash');
var Knex    = require('../../knex');
var Promise = testPromise;

var config = require(process.env.KNEX_TEST || './config.json');

var pool = {
  afterCreate: function(connection, callback) {
    expect(connection).to.have.property('__cid');
    callback(null, connection);
  },
  beforeDestroy: function(connection) {
    expect(connection).to.have.property('__cid');
  }
};

var MySQL = Knex.initialize({
  client: 'mysql',
  connection: config.mysql,
  pool: _.extend({}, pool, {
    afterCreate: function(connection, callback) {
      Promise.promisify(connection.query, connection)("SET sql_mode='TRADITIONAL';", []).then(function() {
        callback(null, connection);
      });
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

    this.dialect = knex.client.dialect;

    require('./schema')(knex);

    require('./migrate')(knex);

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