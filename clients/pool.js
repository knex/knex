(function(define) {

"use strict";

define(function(require, exports) {

  var _           = require('underscore');
  var nodefn      = require('when/node/function');
  var GenericPool = require('generic-pool-redux').Pool;

  // The "Pool" object is a thin wrapper around the
  // generic-pool-redux library, exposing a `destroy`
  // method for explicitly draining the pool. The
  // `init` method is called internally and initializes
  // the pool if it doesn't already exist.
  var Pool = function(config) {
    this.config = config;
  };

  Pool.prototype = {

    // Some basic defaults for the pool... generally you don't really want to keep
    // mutable objects on the prototype, but in this case we're not supposed to be
    // messing around with them, so it should be alright.
    defaults: {
      min: 2,
      max: 10,
      create: function(callback) {
        return nodefn.bindCallback(nodefn.call(instance.getRawConnection).tap(function(connection) {
          connection.__cid = _.uniqueId('__cid');
          if (pool.afterCreate) return nodefn.call(pool.afterCreate, connection);
        }), callback);
      },
      destroy: function(connection, callback) {
        // if (this.beforeDestroy) { this.beforeDestroy(conn)
        return nodefn.bindCallback(when(function() {
          // if (this.beforeDestroy) return nodefn.call()
        }()), callback);
      }
    },

    // Typically only called internally, this initializes
    // a new `GenericPool` instance, based on the `config`
    // options passed into the constructor.
    init: function() {
      this.instance = this.instance || new GenericPool(this.config);
      return this;
    },

    // Tear down the pool, only necessary if you need to
    destroy: function() {
      var poolInstance = this.instance;
      poolInstance.drain(function() {
        poolInstance.destroyAllNow();
      });
      delete this.instance;
      return this;
    }

  };


});

})(
  typeof define === 'function' && define.amd ? define : function(factory) { factory(require, exports); }
);