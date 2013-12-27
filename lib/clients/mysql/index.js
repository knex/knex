// MySQL
// -------

var _ = require('lodash');

// All other local project modules needed in this scope.
var ServerBase = require('../server');
var Promise    = require('../../promise');
var Helpers    = require('../../helpers');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
var MySQLClient = module.exports = function MySQLClient(config) {
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.connectionSettings = config.connection;
    this.initPool(config.pool);
  }
  this.initQuery();
};

// Lazy load the sqlite3 module, since we might just be using
// the client to generate SQL strings.
var mysql;

_.extend(MySQLClient.prototype, ServerBase, {

  dialect: 'mysql',

  // The keyword identifier wrapper format.
  wrapValue: function MySQLClient$wrapValue(value) {
    return (value !== '*' ? Helpers.format('`%s`', value) : "*");
  },

  // Lazy-load the mysql dependency.
  initDriver: function MySQLClient$initDriver() {
    mysql = mysql || require('mysql');
  },

  // Initializes the current client object for
  initQuery: function MySQL$initQuery() {
    this.Query = require('../../query')(this);
    this.QueryBuilder  = require('./query/builder')(this);
    this.QueryCompiler = require('./query/compiler')(this);
  },

  // Lazy-load the schema dependencies.
  initSchema: function MySQLClient$initSchema() {
    this.SchemaBuilder = require('./schema/builder')(this);
    this.SchemaTableCompiler = require('./schema/tablecompiler')(this);
  },

  processResponse: function MySQLClient$processResponse(runner, target, method) {
    return function MySQLClient$handleResponse(resp) {
      var rows = resp[0];
      var fields = resp[1];
      if (target.output) return target.output.call(runner, rows, fields);
      if (method === 'raw') return resp;
      if (method === 'select') return Helpers.skim(rows);
      if (method === 'insert') return [rows.insertId];
      if (method === 'delete' || method === 'update') return rows.affectedRows;
      return rows;
    };
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  execute: Promise.method(function MySQL$execute(connection, target, options) {
    if (!connection) throw new Error('No database connection exists for the query');
    if (options) target.sql = _.extend({sql: target.sql}, options);
    return Promise.promisify(connection.query, connection)(target.sql, target.bindings);
  }),

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  getRawConnection: function MySQL$getRawConnection() {
    var connection = mysql.createConnection(this.connectionSettings);
    return Promise.promisify(connection.connect, connection)().yield(connection);
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function MySQL$destroyRawConnection(connection) {
    connection.end();
  },

  database: function() {
    return this.connectionSettings.database;
  }

});