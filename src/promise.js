
var Promise   = require('bluebird');
var deprecate = require('./helpers').deprecate

Promise.prototype.exec = function(cb) {
  deprecate('.exec', '.nodeify or .asCallback')
  return this.asCallback(cb)
};

module.exports = Promise;
