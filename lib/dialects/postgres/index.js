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
    this.connectionSettings = config.connection;
    this.initPool(config.pool);
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

// Lazy-load the schema dependencies; we may not need to use them.
Client_PG.prototype.initSchema = function() {
  require('./schema')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_PG.prototype.acquireRawConnection = Promise.method(function(callback) {
  var connection = new pg.Client(this.connectionSettings);
  return Promise.promisify(connection.connect, connection)().bind(this).tap(function() {
    if (!this.version) return this.checkVersion(connection);
  }).thenReturn(connection);
}),

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_PG.prototype.destroyRawConnection = function(connection) {
  connection.end();
};

// In PostgreSQL, we need to do a version check to do some feature
// checking on the database.
Client_PG.prototype.checkVersion = function(connection) {
  var instance = this;
  return this.execute(connection, {sql: 'select version();'}).then(function(resp) {
    instance.version = /^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1];
  });
};

module.exports = Client_PG;