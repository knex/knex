'use strict';

// FDB SQL Layer index
// This file was adapted from the PostgreSQL index

var _        = require('lodash');
var inherits = require('inherits');

var Client  = require('../../client');
var Promise = require('../../promise');

var pg;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_FDB(config) {
  Client.apply(this, arguments);
  if (config.returning) this.defaultReturning = config.returning;
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    // If no port has been defined,
    if (!config.connection.port)
      // set the port to the SQL Layer's default port, 15432.
      config.connection.port = 15432;
    this.initDriver();
    this.initRunner();
    this.connectionSettings = config.connection;
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
}
inherits(Client_FDB, Client);

Client_FDB.prototype.dialect = 'fdbsql';

// Lazy load the pg dependency, since we might just be using
// the client to generate SQL strings.
Client_FDB.prototype.initDriver = function() {
  pg = pg || (function() {
    try {
      return require('pg');
    } catch (e) {
      return require('pg.js');
    }
  })();

};

// Attach a `Formatter` constructor to the client object.
Client_FDB.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_FDB.prototype.initRaw = function() {
  require('./raw')(this);
};

// Attaches the `FunctionHelper` constructor to the client object.
Client_FDB.prototype.initFunctionHelper = function() {
  require('./functionhelper')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_FDB.prototype.initTransaction = function() {
  require('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_FDB.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_FDB.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_FDB.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_FDB.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_FDB.prototype.initMigrator = function() {
  require('./migrator')(this);
};

// Lazy-load the seeding dependency
Client_FDB.prototype.initSeeder = function() {
  require('./seeder')(this);
};

var utils;

// Prep the bindings as needed by fdb SQL layer.
Client_FDB.prototype.prepBindings = function(bindings, tz) {
  /*jshint unused: false*/
  utils = utils || require('./utils');
  return _.map(bindings, utils.prepareValue);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_FDB.prototype.acquireRawConnection = Promise.method(function(callback) {
  /*jshint unused: false*/
  // TODO: use callback or remove callback
  var connection = new pg.Client(this.connectionSettings);
  this.databaseName = connection.database;

  var client = this;
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err, connection) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
});

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_FDB.prototype.destroyRawConnection = function(connection) {
  connection.end();
};

// Position the bindings for the query.
Client_FDB.prototype.positionBindings = function(sql) {
  return sql;
};

module.exports = Client_FDB;
