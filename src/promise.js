
var Promise   = require('bluebird');
var deprecate = require('./helpers').deprecate

// Incase we're using an older version of bluebird
Promise.prototype.asCallback = Promise.prototype.nodeify

Promise.prototype.exec = function(cb) {
  deprecate('.exec', '.nodeify or .asCallback')
  return this.nodeify(cb)
};

module.exports = Promise;
