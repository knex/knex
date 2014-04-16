// ServerBase
// -------
var _          = require('lodash');
var Promise    = require('./promise');
var Runner     = require('./runner');

// Base properties & methods "mixed in" to the
// prototypes for each dialect's client.
function Client() {
  this.initFormatter();
  this.initRaw();
  this.initTransaction();
  this.initQuery();
}

// Set the "isDebugging" flag on the client to "true" to log
// all queries run by the client.
Client.prototype.isDebugging = false;

// Internal flag to let us know this is a knex client,
// and what the version number is.
Client.prototype.__knex_client__ = '0.6.0';

// Acquire a connection from the pool.
Client.prototype.acquireConnection = function() {
  var pool = this.pool;
  return new Promise(function(resolver, rejecter) {
    if (!pool) return rejecter(new Error('There is no pool defined on the current client'));
    pool.acquire(function(err, connection) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

// Releases a connection from the connection pool,
// returning a promise resolved when the connection is released.
Client.prototype.releaseConnection = function(connection) {
  var pool = this.pool;
  return new Promise(function(resolver, rejecter) {
    pool.release(connection, function(err) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

module.exports = Client;