
var sqlite3 = require('sqlite3');

var _ = require('underscore');
var util = require('util');
var genericPool = require('generic-pool');

var init, debug, pool, connection, connectionSettings;

// Initializes the sqlite3 module with an options hash,
// containing the connection settings, as well as the
// pool config settings
exports.init = function (options) {

  // If there isn't a connection setting
  if (!options.connection) return;

  connectionSettings = options.connection;
  debug = options.debug;

  // If pooling is disabled, set the query getter to
  // something below and create a connection on the connection object
  if (options.pool === false) {
    pool = false;
    connection = this.getConnection();
    return;
  }

  // Extend the genericPool with the options
  // passed into the init under the "pool" option
  pool = genericPool.Pool(_.extend({
    name : 'sqlite3',
    create : function(callback) {
      var conn = exports.getConnection();
      // Set to allow multiple connections on the database.
      conn.run("PRAGMA journal_mode=WAL;", function () {
        callback(null, conn);
      });
    },
    destroy  : function(client) {
      client.close();
    },
    max : 10,
    min : 2,
    idleTimeoutMillis: 30000,
    log : false
  }, options.pool));
};

exports.query = function (querystring, params, callback, connection) {

  // If there is a connection, use it.
  if (connection) {
    return connection.run(querystring, params, callback);
  }

  // Acquire connection - callback function is called
  // once a resource becomes available.
  pool.acquire(function(err, client) {
    
    if (err) throw new Error(err);

    // Call the querystring and then release the client
    client.all(querystring, params, function (err, resp) {
      pool.release(client);
      callback.apply(this, arguments);
    });

  });

};

// Returns a mysql connection, with a __cid property uniquely
// identifying the connection.
exports.getConnection = function () {
  var connection = new sqlite3.Database(connectionSettings.filename);
  connection.__cid = _.uniqueId('__cid');
  return connection;
};

exports.getSchemaGrammar = function () {
  return require('../schema/sqlite3');
};

exports.grammar = {

  // Compile the "order by" portions of the query.
  compileOrders: function(qb, orders) {
    if (orders.length === 0) return;
    return "order by " + orders.map(function(order) {
      return this.wrap(order.column) + " collate nocase " + order.direction;
    }, this).join(', ');
  },

  // Compile an insert statement into SQL.
  compileInsert: function(qb, values) {
    if (!_.isArray(values)) values = [values];
    var table = this.wrapTable(qb.table);
    var parameters = this.parameterize(values[0]);
    var paramBlocks = [];

    // If there is only one record being inserted, we will just use the usual query
    // grammar insert builder because no special syntax is needed for the single
    // row inserts in SQLite. However, if there are multiples, we'll continue.
    if (values.length === 1) {
      return require('../knex').Grammar.prototype.compileInsert.call(this, qb, values[0]);
    }
    
    var keys = _.keys(values[0]);
    var names = this.columnize(keys);
    var columns = [];

    // SQLite requires us to build the multi-row insert as a listing of select with
    // unions joining them together. So we'll build out this list of columns and
    // then join them all together with select unions to complete the queries.
    for (var i = 0, l = keys.length; i < l; i++) {
      var column = keys[i];
      columns.push('? as ' + this.wrap(column));
    }

    var joinedColumns = columns.join(', ');
    columns = [];
    for (i = 0, l = values.length; i < l; i++) {
      columns.push(joinedColumns);
    }

    return "insert into " + table + " (" + names + ") select " + columns.join(' union select ');
  },

  // Compile a truncate table statement into SQL.
  compileTruncate: function (qb) {
    var sql = {};
    sql['delete from sqlite_sequence where name = ?'] = [qb.from];
    sql['delete from ' + this.wrapTable(query.from)] = [];
    return sql;
  },

  wrapValue: function(value) {
    return (value !== '*' ? util.format('"%s"', value) : "*");
  }
};
