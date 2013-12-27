// Pool
// -------
module.exports = function(client) {
  var _           = require('lodash');
  var GenericPool = require('generic-pool-redux').Pool;

  var Helpers     = require('../helpers');
  var Promise     = require('../promise');

  // The "Pool" object is a thin wrapper around the
  // "generic-pool-redux" library, exposing a `destroy`
  // method for explicitly draining the pool. The
  // `init` method is called internally and initializes
  // the pool if it doesn't already exist.
  var Pool = function(config) {
    _.bindAll(this, 'acquire', 'release');
    this.init(config);
  };

  _.extend(Pool.prototype, {

    // Typically only called internally, this initializes
    // a new `GenericPool` instance, based on the `config`
    // options passed into the constructor.
    init: function(config) {
      if (config) this.config = config;
      this.poolInstance = this.poolInstance || new GenericPool(_.defaults(this.config, _.result(this, 'defaults')));
      return this.poolInstance;
    },

    // Some basic defaults for the pool...
    defaults: function() {
      var pool = this;
      return {
        min: 2,
        max: 10,
        create: function(callback) {
          var promise = client.getRawConnection()
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

    // Acquires a connection from the pool.
    acquire: function(callback, priority) {
      return (this.poolInstance || this.init()).acquire(callback, priority);
    },

    // Release a connection back to the connection pool.
    release: function(connection, callback) {
      this.poolInstance.release(connection, callback);
    },

    // Tear down the pool, only necessary if you need it.
    destroy: function(callback) {
      var poolInstance = this.poolInstance;
      if (poolInstance) {
        poolInstance.drain(function() {
          poolInstance.destroyAllNow(callback);
        });
        this.poolInstance = void 0;
      } else {
        callback();
      }
      return this;
    }

  });

  return Pool;
};