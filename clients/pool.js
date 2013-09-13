// Pool
// -------
(function(define) {

"use strict";

define(function(require, exports) {

  // All of the "when.js" promise components needed in this module.
  var when        = require('when');
  var nodefn      = require('when/node/function');

  var _           = require('underscore');
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
    this.init();
  };

  Pool.prototype = {

    // Some basic defaults for the pool... generally you don't really want to keep
    // mutable objects on the prototype, but in this case we're not supposed to be
    // messing around with them, so it should be alright.
    defaults: function() {
      var poolInstance = this;
      return {
        min: 2,
        max: 10,
        create: function(callback) {
          var promise = poolInstance.client.getRawConnection()
            .tap(function(connection) {
              connection.__cid = _.uniqueId('__cid');
              if (poolInstance.config.afterCreate) {
                return nodefn.call(poolInstance.config.afterCreate, connection);
              }
            });
          return nodefn.bindCallback(promise, callback);
        },
        destroy: function(connection) {
          if (poolInstance.config.beforeDestroy) {
            return poolInstance.config.beforeDestroy(connection, function() {
              poolInstance.client.getRawConnection(connection);
            });
          }
          poolInstance.client.getRawConnection(connection);
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

    // Acquires a connection from the pool.
    acquire: function(callback, priority) {
      return (this.poolInstance || this.init()).acquire(callback, priority);
    },

    // Release a connection back to the connection pool.
    release: function(connection, callback) {
      return this.poolInstance.release(connection, callback);
    },

    // Tear down the pool, only necessary if you need it.
    destroy: function() {
      var poolInstance = this.poolInstance;
      poolInstance.drain(function() {
        poolInstance.destroyAllNow();
      });
      delete this.poolInstance;
      return this;
    }

  };

  // Grab the standard `Object.extend` as popularized by Backbone.js.
  Pool.extend = Helpers.extend;

  exports.Pool = Pool;

});

})(
  typeof define === 'function' && define.amd ? define : function(factory) { factory(require, exports); }
);