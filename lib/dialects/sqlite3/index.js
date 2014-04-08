// SQLite3
// -------

// Other dependencies, including the `sqlite3` library,
// which needs to be added as a dependency to the project
// using this database.
var _ = require('lodash');

// All other local project modules needed in this scope.
var ServerBase  = require('../server');
var Promise     = require('../../promise');

var utils = require('../../utils');

function Client_SQLite3(config) {
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.connectionSettings = config.connection;
    this.initPool(config.pool);
  }
  // Todo: Plugins here possibly??
}

// Lazy load the sqlite3 module, since we might just be using
// the client to generate SQL strings.
var sqlite3;

Client_SQLite3.prototype.dialect = 'sqlite3',

Client_SQLite3.prototype.initTransaction = function() {
  require('./transaction')(this);
};

Client_SQLite3.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Lazy-load the sqlite3 dependency.
Client_SQLite3.prototype.initDriver = function() {
  sqlite3 = sqlite3 || require('sqlite3');
};

// Initialize the raw connection on the client.
Client_SQLite3.prototype.initRaw = function() {
  require('./raw')(this);
};

// Always initialize with the "Query" and "QueryCompiler"
// objects, each of which is unique to this client (and thus)
// can be altered without messing up anything for anyone else.
Client_SQLite3.prototype.initQuery = function() {
  require('./query')(this);
};

// Lazy-load the schema dependencies.
Client_SQLite3.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_SQLite3.prototype.initMigrator = function() {
  require('./migrator')(this);
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Client_SQLite3.prototype.execute = Promise.method(function(connection, target, options, method) {
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
Client_SQLite3.prototype.processResponse = function(runner, target, method) {
  return function(response) {
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
};

Client_SQLite3.prototype.poolDefaults = function() {
  return {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  };
};

Client_SQLite3.prototype.acquireRawConnection = function() {
  var driver = this;
  return new Promise(function(resolve, reject) {
    var db = new sqlite3.Database(driver.connectionSettings.filename, function(err) {
      if (err) return reject(err);
      resolve(db);
    });
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_SQLite3.prototype.destroyRawConnection = Promise.method(function(connection) {
  connection.close();
});

// Begins a transaction statement on the instance,
// resolving with the connection of the current transaction.
Client_SQLite3.prototype.startTransaction = Promise.method(function() {
  return this.acquireConnection()
    .bind(this)
    .tap(function(connection) {
      return this.execute(connection, {sql: 'begin transaction;'}, null);
    });
});

// Finishes the transaction statement on the instance.
Client_SQLite3.prototype.finishTransaction = Promise.method(function(type, transaction, msg) {
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
});

module.exports = Client_SQLite3;