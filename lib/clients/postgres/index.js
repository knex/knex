// PostgreSQL
// -------

// Other dependencies, including the `pg` library,
// which needs to be added as a dependency to the project
// using this database.
var _    = require('lodash');

// All other local project modules needed in this scope.
var ServerBase = require('../server');
var Promise    = require('../../promise');
var Helpers    = require('../../helpers');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
var PostgreSQLClient = module.exports = function PostgreSQLClient(config) {
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
var pg;

_.extend(PostgreSQLClient.prototype, ServerBase, {

  dialect: 'postgresql',

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? Helpers.format('"%s"', value) : "*");
  },

  // Lazy-load the pg dependency.
  initDriver: function PostgreSQLClient$initDriver() {
    pg = pg || require('pg');
  },

  // Load the query builder constructors.
  initQuery: function PostgreSQLClient$initQuery() {
    this.Query  = require('./query/builder')(this);
    this.QueryCompiler = require('./query/compiler')(this);
  },

  initStateless: function() {
    this.StatelessQuery = require('../../query/stateless')(this);
  },

  // Lazy-load the schema dependencies.
  initSchema: function PostgreSQLClient$initSchema() {
    this.SchemaBuilder = require('./schema/builder')(this);
    this.SchemaTableCompiler = require('./schema/tablecompiler')(this);
  },

  replaceQ: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function(runner, target, method) {
    return function PostgreSQLClient$handleResponse(resp) {
      var returning = runner.flags.returning;
      if (target.output) return target.output.call(runner, resp);
      if (resp.command === 'SELECT') return resp.rows;
      if (resp.command === 'INSERT' || (resp.command === 'UPDATE' && returning)) {
        var returns = [];
        for (var i = 0, l = resp.rows.length; i < l; i++) {
          var row = resp.rows[i];
          if (returning === '*' || _.isArray(returning)) {
            returns[i] = row;
          } else {
            returns[i] = row[returning];
          }
        }
        return returns;
      }
      if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
        return resp.rowCount;
      }
      return resp;
    };
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  execute: Promise.method(function PostgreSQLClient$execute(connection, target, options) {
    if (!connection) throw new Error('No database connection exists for the query');
    var sql = this.replaceQ(target.sql);
    if (options) sql = _.extend({text: sql}, options);
    return Promise.promisify(connection.query, connection)(sql, target.bindings);
  }),

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  getRawConnection: Promise.method(function(callback) {
    var connection = new pg.Client(this.connectionSettings);
    return Promise.promisify(connection.connect, connection)().bind(this).tap(function() {
      if (!this.version) return this.checkVersion(connection);
    }).yield(connection);
  }),

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection) {
    connection.end();
  },

  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion: function(connection) {
    var instance = this;
    return this.execute(connection, {sql: 'select version();'}).then(function(resp) {
      instance.version = /^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1];
    });
  }

});