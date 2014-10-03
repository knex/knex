'use strict';

// MySQL Client
// -------
var inherits = require('inherits');

var _       = require('lodash');
var Client  = require('../../client');
var Promise = require('../../promise');

var mysql;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  Client.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.initRunner();
    this.connectionSettings = _.clone(config.connection);
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
}
inherits(Client_MySQL, Client);

// The "dialect", for reference elsewhere.
Client_MySQL.prototype.dialect = 'mysql';

// Lazy-load the mysql dependency, since we might just be
// using the client to generate SQL strings.
Client_MySQL.prototype.initDriver = function() {
  mysql = mysql || require('mysql');
};

// Attach a `Formatter` constructor to the client object.
Client_MySQL.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_MySQL.prototype.initRaw = function() {
  require('./raw')(this);
};

// Attaches the `FunctionHelper` constructor to the client object.
Client_MySQL.prototype.initFunctionHelper = function() {
  require('./functionhelper')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_MySQL.prototype.initTransaction = function() {
  require('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_MySQL.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_MySQL.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_MySQL.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_MySQL.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_MySQL.prototype.initMigrator = function() {
    require('./migrator')(this);
};

// Lazy-load the seeding dependency
Client_MySQL.prototype.initSeeder = function() {
    require('./seeder')(this);
};

// MySQL Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.genericPool.destroy(connection);
  }
}

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MySQL.prototype.acquireRawConnection = function() {
  var client = this;
  var connection = mysql.createConnection(this.connectionSettings);
  this.databaseName = connection.config.database;
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err) {
      if (err) return rejecter(err);
      connection.on('error', connectionErrorHandler.bind(null, client, connection));
      connection.on('end', connectionErrorHandler.bind(null, client, connection));
      resolver(connection);
    });
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_MySQL.prototype.destroyRawConnection = function(connection) {
  connection.end();
};

module.exports = Client_MySQL;