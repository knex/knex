
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
Promise.prototype.exec = Promise.prototype.nodeify;

Promise.resolve = Promise.fulfilled;
Promise.reject  = Promise.rejected;

exports.Promise = Promise;