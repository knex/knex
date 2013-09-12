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

  // The "Pool" object is a thin wrapper around the
  // "generic-pool-redux" library, exposing a `destroy`
  // method for explicitly draining the pool. The
  // `init` method is called internally and initializes
  // the pool if it doesn't already exist.
  var Pool = function(config, client) {
    if (config.afterCreate) {
      this.afterCreate = config.afterCreate;
    }
    _.bindAll(this, 'acquire', 'create', 'release', 'afterCreate', 'beforeDestroy');
    this.config = _.extend({}, config, {
      create:  this.create,
      destroy: this.beforeDestroy
    });
    this.client = client;
    this.init();
  };

  Pool.prototype = {

    // Some basic defaults for the pool... generally you don't really want to keep
    // mutable objects on the prototype, but in this case we're not supposed to be
    // messing around with them, so it should be alright.
    defaults: {
      min: 2,
      max: 10
    },

    // Typically only called internally, this initializes
    // a new `GenericPool` instance, based on the `config`
    // options passed into the constructor.
    init: function() {
      this.instance = this.instance || new GenericPool(_.defaults(this.config, this.defaults));
      return this.instance;
    },

    // Extend these if you want to have some action taking place just after
    // the connection is created, or just before the connection is destroyed.
    afterCreate:   function() {},
    beforeDestroy: function() {},

    // Create a new connection on the pool.
    create: function(callback) {
      var promise = this.client.getRawConnection()
        .tap(function(connection) { connection.__cid = _.uniqueId('__cid'); })
        .tap(this.afterCreate);
      return nodefn.bindCallback(promise, callback);
    },

    acquire: function(callback, priority) {
      return (this.instance || (this.init())).acquire(callback, priority);
    },

    // Release a connection back to the connection pool.
    release: function(connection, callback) {
      this.instance.release(connection);
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

  exports.Pool = Pool;

});

})(
  typeof define === 'function' && define.amd ? define : function(factory) { factory(require, exports); }
);