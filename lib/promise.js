(function(define) {

"use strict";

define(function(require, exports) {

  var Promise = require('bluebird/js/main/promise')();

  Promise.prototype.yield = function(value) {
    return this.then(function() {
      return value;
    });
  };

  Promise.prototype.tap = function(handler) {
    return this.then(handler).yield(this);
  };

  Promise.prototype.ensure = Promise.prototype.lastly;
  Promise.prototype.otherwise = Promise.prototype.caught;

  Promise.resolve = Promise.fulfilled;
  Promise.reject  = Promise.rejected;

  exports.Promise = Promise;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);