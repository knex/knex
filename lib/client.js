'use strict';

// "Base Client"
// ------
var Promise    = require('./promise');
var _          = require('lodash');
var inherits   = require('inherits');
var EventEmitter = require('events').EventEmitter;

// The base client provides the general structure
// for a dialect specific client object. The client
// object attaches fresh constructors for each component
// of the library.
function Client(config) {
  this.initFormatter();
  this.initRaw();
  this.initTransaction();
  this.initQuery();
  this.migrationConfig = _.clone(config && config.migrations);
  this.seedConfig = _.clone(config && config.seeds);
}
inherits(Client, EventEmitter);

// Set the "isDebugging" flag on the client to "true" to log
// all queries run by the client.
Client.prototype.isDebugging = false;

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

// Destroy the current connection pool for the client.
Client.prototype.destroy = function(callback) {
  var pool = this.pool;
  var promise = new Promise(function(resolver, rejecter) {
    if (!pool) resolver();
    pool.destroy(function(err) {
      if (err) return rejecter(err);
      resolver();
    });
  });
  // Allow either a callback or promise interface for destruction.
  if (typeof callback === 'function') {
    promise.exec(callback);
  } else {
    return promise;
  }
};

// Return the database being used by this client.
Client.prototype.database = function() {
  return this.connectionSettings.database;
};

module.exports = Client;
