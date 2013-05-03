var Q      = require('q');
var _      = require('underscore');
var Knex   = require('../knex');
var conn   = require(process.env.KNEX_TEST || './shared/config');
var base   = require('../clients/base');
var objectdump = require('objectdump');

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

var runQuery = MySql.runQuery;
Knex.runQuery = function(builder, data) {
  builder._asSql = true;
  return runQuery.call(this, builder, data);
};

var obj = {};
var counter = {};
var handler = function(instance, section) {
  var item = 1;
  return function(resolver) {
    return function(data) {
      // if (_.isArray(data)) console.log(data);
      var label = '' + section + '.' + item;
      obj[label] = obj[label] || {};
      obj[label][instance] = data;
      item++;
      resolver();
    };
  };
};

describe('Knex.SchemaBuilder', function() {
  require('./lib/schema')(MySql, 'mysql', handler('mysql', 'schema'));
  require('./lib/schema')(Sqlite3, 'sqlite3', handler('sqlite3', 'schema'));
  require('./lib/schema')(Postgres, 'postgres', handler('postgres', 'schema'));
});

describe('Knex.Builder', function() {

  describe('Inserts', function() {
    require('./lib/inserts')(MySql, 'mysql', handler('mysql', 'inserts'));
    require('./lib/inserts')(Sqlite3, 'sqlite3', handler('sqlite3', 'inserts'));
    require('./lib/inserts')(Postgres, 'postgres', handler('postgres', 'inserts'));
  });

  describe('Updates', function() {
    require('./lib/updates')(MySql, 'mysql', handler('mysql', 'updates'));
    require('./lib/updates')(Sqlite3, 'sqlite3', handler('sqlite3', 'updates'));
    require('./lib/updates')(Postgres, 'postgres', handler('postgres', 'updates'));
  });

  describe('Selects', function() {
    require('./lib/selects')(MySql, 'mysql', handler('mysql', 'selects'));
    require('./lib/selects')(Sqlite3, 'sqlite3', handler('sqlite3', 'selects'));
    require('./lib/selects')(Postgres, 'postgres', handler('postgres', 'selects'));
  });

  describe('Deletes', function() {
    require('./lib/deletes')(MySql, 'mysql', handler('mysql', 'deletes'));
    require('./lib/deletes')(Sqlite3, 'sqlite3', handler('sqlite3', 'deletes'));
    require('./lib/deletes')(Postgres, 'postgres', handler('postgres', 'deletes'));
  });

  describe('Aggregates, Truncate', function() {
    // require('./lib/aggregate')(MySql, 'mysql', handler('mysql', 'aggregate'));
    // require('./lib/aggregate')(Sqlite3, 'sqlite3', handler('sqlite3', 'aggregate'));
    // require('./lib/aggregate')(Postgres, 'postgres', handler('postgres', 'aggregate'));
  });

  after(function() {
    require('fs').writeFileSync('./test/shared/output.js', 'module.exports = ' + objectdump(obj));
  });
});
