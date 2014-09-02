'use strict';

// Pool
// -------
var _           = require('lodash');
var GenericPool = require('generic-pool-redux').Pool;
var Promise     = require('./promise');

// The "Pool" object is a thin wrapper around the
// "generic-pool-redux" library, exposing a `destroy`
// method for explicitly draining the pool. The
// `init` method is called internally and initializes
// the pool if it doesn't already exist.
function Pool(config) {
  this.config = _.clone(config) || {};
  this.genericPool = this.initialize();
}

// Typically only called internally, this initializes
// a new `GenericPool` instance, based on the `config`
// options passed into the constructor.
Pool.prototype.initialize = function() {
  return new GenericPool(_.defaults(this.config, _.result(this, 'defaults')));
};

// Some basic defaults for the pool...
Pool.prototype.defaults = function() {
  var pool = this;
  return {
    min: 2,
    max: 10,
    create: function(callback) {
      pool.client.acquireRawConnection()
        .tap(function(connection) {
          connection.__cid = _.uniqueId('__cid');
          if (pool.config.afterCreate) {
            return Promise.promisify(pool.config.afterCreate)(connection);
          }
        }).exec(callback);
    },
    destroy: function(connection) {
      if (pool.config.beforeDestroy) {
        return pool.config.beforeDestroy(connection, function() {
          connection.end();
        });
      }
      connection.end();
    }
  };
};

// Acquires a connection from the pool.
Pool.prototype.acquire = function(callback, priority) {
  if (this.genericPool) {
    this.genericPool.acquire(callback, priority);
  } else {
    callback(new Error('The genericPool is not initialized.'));
  }
};

// Release a connection back to the connection pool.
Pool.prototype.release = function(connection, callback) {
  if (this.genericPool) {
    this.genericPool.release(connection, callback);
  } else {
    callback(new Error('The genericPool is not initialized.'));
  }
};

// Tear down the pool, only necessary if you need it.
Pool.prototype.destroy = function(callback) {
  var genericPool = this.genericPool;
  if (genericPool) {
    genericPool.drain(function() {
      genericPool.destroyAllNow(callback);
    });
    this.genericPool = void 0;
  } else {
    callback();
  }
  return this;
};

module.exports = Pool;