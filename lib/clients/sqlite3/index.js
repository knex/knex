// SQLite3
// -------

// Other dependencies, including the `sqlite3` library,
// which needs to be added as a dependency to the project
// using this database.
var _ = require('lodash');

// All other local project modules needed in this scope.
var ServerBase  = require('../server');
var Transaction = require('../../transaction');
var Promise     = require('../../promise');

var helpers     = require('../../helpers');
var formatter   = require('../../formatter');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
var SQLite3Client = module.exports = function SQLite3Client(config) {
  this.Formatter = formatter(this, '"');
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
var sqlite3;

_.extend(SQLite3Client.prototype, ServerBase, {

  dialect: 'sqlite3',

  // Lazy-load the sqlite3 dependency.
  initDriver: function SQLite3$initDriver() {
    sqlite3 = sqlite3 || require('sqlite3');
  },

  initQuery: function SQLite3$initQuery() {
    this.Query  = require('./query/builder')(this);
    this.QueryCompiler = require('./query/compiler')(this);
  },

  // Lazy-load the schema dependencies.
  initSchema: function SQLite3$initSchema() {
    this.SchemaBuilder = require('./schema/builder')(this);
    this.SchemaTableCompiler = require('./schema/tablecompiler')(this);
  },

  initStateless: function() {
    this.StatelessQuery = require('../../query/stateless')(this);
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  execute: Promise.method(function SQLite3$execute(connection, target, options, method) {
    if (!connection) throw new Error('No database connection exists for the query');
    var callMethod = (method === 'insert' || method === 'update' || method === 'delete') ? 'run' : 'all';
    return new Promise(function(resolver, rejecter) {
      connection[callMethod](target.sql, target.bindings, function(err, resp) {
        if (err) return rejecter(err);
        // We need the context here, because it has the "this.lastID" or "this.changes"
        return resolver([resp, this]);
      });
    });
  }),

  // Ensures the response is returned in the same format as other clients.
  processResponse: function SQLite3$processResponse(runner, target, method) {
    return function SQLite3$handleResponse(response) {
      var ctx = response[1];
      var resp = response[0];
      if (target.output) return target.output.call(runner, resp);
      if (method === 'select') {
        resp = helpers.skim(resp);
      } else if (method === 'insert') {
        resp = [ctx.lastID];
      } else if (method === 'delete' || method === 'update') {
        resp = ctx.changes;
      }
      return resp;
    };
  },

  poolDefaults: function() {
    return {
      max: 1,
      min: 1,
      destroy: function(client) { client.close(); }
    };
  },

  getRawConnection: function SQLite3$getRawConnection() {
    var driver = this;
    return new Promise(function(resolve, reject) {
      var db = new sqlite3.Database(driver.connectionSettings.filename, function(err) {
        if (err) return reject(err);
        resolve(db);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: Promise.method(function SQLite3$destroyRawConnection(connection) {
    connection.close();
  }),

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: Promise.method(function SQLite3$startTransaction() {
    return this.getConnection()
      .bind(this)
      .tap(function(connection) {
        return this.execute(connection, {sql: 'begin transaction;'}, null);
      });
  }),

  // Finishes the transaction statement on the instance.
  finishTransaction: Promise.method(function SQLite3$finishTransaction(type, transaction, msg) {
    var client = this, dfd = transaction.dfd;
    return this.execute(transaction.connection, {sql: type + ';'}).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }).caught(function(e) {
      dfd.reject(e);
      throw e;
    }).lastly(function() {
      return client.releaseConnection(transaction.connection).tap(function() {
        transaction.connection = null;
      });
    });
  })

});