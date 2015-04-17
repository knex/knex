'use strict';

// "Base Client"
// ------
var Promise      = require('./promise')
var helpers      = require('./helpers')
var Pool2        = require('pool2')
var _            = require('lodash');
var inherits     = require('inherits');
var EventEmitter = require('events').EventEmitter;

// The base client provides the general structure
// for a dialect specific client object. The client
// object attaches fresh constructors for each component
// of the library.
function Client(config) {
  if (config.debug) {
    this.isDebugging = true;
  }
  this.initFormatter();
  this.initRaw();
  this.initTransaction();
  this.initQuery();
  this.migrationConfig = _.clone(config && config.migrations);
  this.seedConfig      = _.clone(config && config.seeds);
  if (config.connection) {
    this.initialize(config)
  }
}
inherits(Client, EventEmitter);

Client.prototype.initialize = function(config) {
  this.initDriver();
  this.initRunner();
  this.connectionSettings = _.clone(config.connection);
  if (this.pool) this.destroy()
  this.pool = new Pool2(_.extend(this.poolDefaults(config.pool), config.pool));
  this.pool.on('error', function(err) {
    helpers.error('Pool2 - ' + err)
  })
  this.pool.on('warn', function(msg) {
    helpers.warn('Pool2 - ' + msg)
  })
};

Client.prototype.poolDefaults = function(poolConfig) {
  var dispose, client = this
  if (poolConfig.destroy) {
    deprecate('config.pool.destroy', 'config.pool.dispose')
    dispose = poolConfig.destroy
  }
  return {
    min: 2,
    max: 10,
    acquire: function(callback) {
      client.acquireRawConnection()
        .tap(function(connection) {
          connection.__knexUid = _.uniqueId('__knexUid');
          if (poolConfig.afterCreate) {
            return Promise.promisify(poolConfig.afterCreate)(connection);
          }
        })
        .nodeify(callback);
    },
    dispose: function(connection, callback) {
      if (poolConfig.beforeDestroy) {
        poolConfig.beforeDestroy(connection, function() {
          if (connection !== undefined) {
            client.destroyRawConnection(connection, callback)
          }
        })
      } else if (connection !== void 0) {
        client.destroyRawConnection(connection, callback)
      }
    }
  }
}

// Set the "isDebugging" flag on the client to "true" to log
// all queries run by the client.
Client.prototype.isDebugging = false;

// Acquire a connection from the pool.
Client.prototype.acquireConnection = function() {
  var pool = this.pool;
  return new Promise(function(resolver, rejecter) {
    if (!pool) return rejecter(new Error('There is no pool defined on the current client'))
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
    pool.release(connection) 
    resolver()
  })
};

// Destroy the current connection pool for the client.
Client.prototype.destroy = function(callback) {
  var client = this;
  var promise = new Promise(function(resolver, rejecter) {
    if (!client.pool) return resolver();
    client.pool.end(function() {
      client.pool = undefined
      resolver();
    });
  });
  // Allow either a callback or promise interface for destruction.
  if (typeof callback === 'function') {
    promise.nodeify(callback);
  } else {
    return promise;
  }
};

// Return the database being used by this client.
Client.prototype.database = function() {
  return this.databaseName || this.connectionSettings.database;
};

module.exports = Client;
