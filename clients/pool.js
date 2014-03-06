// Pool
// -------
var domain      = require('domain');

var Promise     = require('../lib/promise').Promise;

var _           = require('lodash');
var GenericPool = require('generic-pool-redux').Pool;

var Helpers     = require('../lib/helpers').Helpers;

// The "Pool" object is a thin wrapper around the
// "generic-pool-redux" library, exposing a `destroy`
// method for explicitly draining the pool. The
// `init` method is called internally and initializes
// the pool if it doesn't already exist.
var Pool = function(config, client) {
  _.bindAll(this, 'acquire', 'release');
  this.config = config;
  this.client = client;
  if (!config || !client) {
    throw new Error('The config and client are required to use the pool module.');
  }
  this.init();
};

Pool.prototype = {

  // Some basic defaults for the pool...
  defaults: function() {
    var pool = this;
    return {
      min: 2,
      max: 10,
      create: function(callback) {
        var promise = pool.client.getRawConnection()
          .tap(function(connection) {
            connection.__cid = _.uniqueId('__cid');
            if (pool.config.afterCreate) {
              return Promise.promisify(pool.config.afterCreate)(connection);
            }
          });
        return promise.nodeify(callback);
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
  },

  // Typically only called internally, this initializes
  // a new `GenericPool` instance, based on the `config`
  // options passed into the constructor.
  init: function(config) {
    if (config) this.config = _.extend(this.config, config);
    this.poolInstance = this.poolInstance || new GenericPool(_.defaults(this.config, _.result(this, 'defaults')));
    return this.poolInstance;
  },

  // Acquires a connection from the pool and
  // adds it to the active domain.
  acquire: function(callback, priority) {
    var activeDomain = domain.active;

    if (activeDomain) {
      // create a closure for callback and its wrapper to run
      // code within active domain which is the domain at the time
      // when `acquire` has been called, not `callback` which is
      // very important otherwise `callback` might end up somewhere else
      callback = (function (callback) {
        return function callbackWithinDomain(error, connection) {
          activeDomain.run(function () {
            if (error) {
              return callback(error);
            }

            activeDomain.add(connection);

            callback(null, callback);
          });
        };
      })(callback);
    }

    return (this.poolInstance || this.init()).acquire(callback, priority);
  },

  // Releases a connection back to the connection pool
  // and removes it from the domain it's assigned to.
  release: function(connection, callback) {
    var activeDomain = connection.domain;
    if (activeDomain) {
      activeDomain.remove(connection);
    }

    this.poolInstance.release(connection, callback);
  },

  // Tear down the pool, only necessary if you need it.
  destroy: function(callback) {
    var poolInstance = this.poolInstance;
    if (poolInstance) {
      poolInstance.drain(function() {
        poolInstance.destroyAllNow(callback);
      });
      delete this.poolInstance;
    } else {
      callback();
    }
    return this;
  }

};

// Grab the standard `Object.extend` as popularized by Backbone.js.
Pool.extend = Helpers.extend;

exports.Pool = Pool;
