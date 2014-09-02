'use strict';

// SQLite3
// -------

var inherits = require('inherits');

var Client  = require('../../client');
var Promise = require('../../promise');

function Client_SQLite3(config) {
  Client.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.initRunner();
    this.connectionSettings = config.connection;
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
  // Todo: Plugins here possibly??
}
inherits(Client_SQLite3, Client);

// Lazy load the sqlite3 module, since we might just be using
// the client to generate SQL strings.
var sqlite3;

Client_SQLite3.prototype.dialect = 'sqlite3';

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

// Attaches the `FunctionHelper` constructor to the client object.
Client_SQLite3.prototype.initFunctionHelper = function() {
  require('./functionhelper')(this);
};

// Always initialize with the "Query" and "QueryCompiler"
// objects, each of which is unique to this client (and thus)
// can be altered without messing up anything for anyone else.
Client_SQLite3.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_SQLite3.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_SQLite3.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies.
Client_SQLite3.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_SQLite3.prototype.initMigrator = function() {
    require('./migrator')(this);
};

// Lazy-load the seeding dependency
Client_SQLite3.prototype.initSeeder = function() {
    require('./seeder')(this);
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