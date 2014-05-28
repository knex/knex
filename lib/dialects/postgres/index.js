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

Client_PG.prototype.dialect = 'postgresql',

// Lazy load the pg dependency, since we might just be using
// the client to generate SQL strings.
Client_PG.prototype.initDriver = function() {
  pg = pg || (function() {
    try {
      return require('pg');
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

var utils;

// Prep the bindings as needed by PostgreSQL.
Client_PG.prototype.prepBindings = function(bindings, tz) {
  utils = utils || require('./utils');
  return _.map(bindings, utils.prepareValue);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_PG.prototype.acquireRawConnection = Promise.method(function(callback) {
  var connection = new pg.Client(this.connectionSettings);
  var client = this;
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err, connection) {
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
}),

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

module.exports = Client_PG;