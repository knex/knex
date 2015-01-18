'use strict';

// PostgreSQL
// -------
var _        = require('lodash');
var inherits = require('inherits');

var Client  = require('../../client');
var Promise = require('../../promise');

var pg;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_PG(config) {
  Client.apply(this, arguments);
  if (config.returning) this.defaultReturning = config.returning;
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.initRunner();
    this.connectionSettings = config.connection;
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
}
inherits(Client_PG, Client);

Client_PG.prototype.dialect = 'postgresql';

// Lazy load the pg dependency, since we might just be using
// the client to generate SQL strings.
Client_PG.prototype.initDriver = function() {
  pg = pg || (function() {
    try {
      var pgn = require('pg');
      try {
        return pgn.native || pgn;
      } catch (e) {
        return pgn;
      }
    } catch (e) {
      return require('pg.js');
    }
  })();
};

// Attach a `Formatter` constructor to the client object.
Client_PG.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_PG.prototype.initRaw = function() {
  require('./raw')(this);
};

// Attaches the `FunctionHelper` constructor to the client object.
Client_PG.prototype.initFunctionHelper = function() {
  require('./functionhelper')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_PG.prototype.initTransaction = function() {
  require('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_PG.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_PG.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_PG.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_PG.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_PG.prototype.initMigrator = function() {
  require('./migrator')(this);
};

// Lazy-load the seeding dependency
Client_PG.prototype.initSeeder = function() {
  require('./seeder')(this);
};

var utils;

// Prep the bindings as needed by PostgreSQL.
Client_PG.prototype.prepBindings = function(bindings, tz) {
  /*jshint unused: false*/
  utils = utils || require('./utils');
  return _.map(bindings, utils.prepareValue);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_PG.prototype.acquireRawConnection = Promise.method(function(callback) {
  /*jshint unused: false*/
  // TODO: use callback or remove callback
  var connection = new pg.Client(this.connectionSettings);
  this.databaseName = connection.database;

  var client = this;
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err) {
      if (err) return rejecter(err);
      if (!client.version) {
        return client.checkVersion(connection).then(function(version) {
          client.version = version;
          resolver(connection);
        });
      }
      resolver(connection);
    });
  });
});

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_PG.prototype.destroyRawConnection = function(connection) {
  connection.end();
};

// In PostgreSQL, we need to do a version check to do some feature
// checking on the database.
Client_PG.prototype.checkVersion = function(connection) {
  return new Promise(function(resolver, rejecter) {
    connection.query('select version();', function(err, resp) {
      if (err) return rejecter(err);
      resolver(/^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1]);
    });
  });
};

// Position the bindings for the query.
Client_PG.prototype.positionBindings = function(sql) {
  var questionCount = 0;
  return sql.replace(/\?/g, function() {
    questionCount++;
    return '$' + questionCount;
  });
};

module.exports = Client_PG;
