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

// Get a raw connection from the database, returning a promise with the connection object.
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

module.exports = Client_SQLite3;