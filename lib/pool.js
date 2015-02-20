'use strict';

// Pool
// -------
var _       = require('lodash');
var Pool2   = require('pool2');
var Promise = require('./promise');

// The "Pool" object is a thin wrapper around the
// "generic-pool-redux" library, exposing a `destroy`
// method for explicitly draining the pool. The
// `init` method is called internally and initializes
// the pool if it doesn't already exist.
function Pool(config) {
  this.config = _.clone(config) || {};
  this.pool = this.initialize();
}

// Typically only called internally, this initializes
// a new `Pool` instance, based on the `config`
// options passed into the constructor.
Pool.prototype.initialize = function() {
  return new Pool2(_.defaults(this.config, _.result(this, 'defaults')));
};

// Some basic defaults for the pool...
Pool.prototype.defaults = function() {
  var pool = this;
  return {
    min: 2,
    max: 10,
    acquire: function(callback) {
      pool.client.acquireRawConnection()
        .tap(function(connection) {
          connection.__cid = _.uniqueId('__cid');
          if (pool.config.afterCreate) {
            return Promise.promisify(pool.config.afterCreate)(connection);
          }
        }).exec(callback);
    },
    release: function(connection, callback) {
      if (pool.config.beforeDestroy) {
        return pool.config.beforeDestroy(connection, function() {
          if (connection !== void 0) connection.end(callback);
        });
      }
      else if (connection !== void 0) connection.end(callback);
    }
  };
};

// Acquires a connection from the pool.
Pool.prototype.acquire = function(callback) {
  if (this.pool) {
    this.pool.acquire(callback);
  } else {
    callback(new Error('The pool is not initialized.'));
  }
};

// Release a connection back to the connection pool.
Pool.prototype.release = function(connection, callback) {
  if (this.pool) {
    // release is now fire-and-forget
    this.pool.release(connection);
    callback();
  } else {
    callback(new Error('The pool is not initialized.'));
  }
};

// Tear down the pool, only necessary if you need it.
Pool.prototype.destroy = function(callback) {
  var pool = this.pool;
  if (pool) {
    pool.end(callback);
    this.pool = void 0;
  } else {
    callback();
  }
  return this;
};

module.exports = Pool;
