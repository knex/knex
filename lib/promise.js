var Promise = require('bluebird/js/main/promise')();

Promise.prototype.yield = Promise.prototype.thenReturn;
Promise.prototype.tap = Promise.prototype.tap;
Promise.prototype.ensure = Promise.prototype.lastly;
Promise.prototype.otherwise = Promise.prototype.caught;
Promise.prototype.exec = Promise.prototype.nodeify;

Promise.resolve = Promise.fulfilled;
Promise.reject  = Promise.rejected;

module.exports  = Promise;