
var Promise   = require('bluebird');
var deprecate = require('./helpers').deprecate

Promise.prototype.exec = function(cb) {
  deprecate('.exec', '.asCallback')
  return this.asCallback(cb)
};

module.exports = Promise;
