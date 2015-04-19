'use strict';

var Promise   = require('bluebird/js/main/promise')();
var deprecate = require('./helpers').deprecate

Promise.prototype.yield     = Promise.prototype.thenReturn;
Promise.prototype.ensure    = Promise.prototype.lastly;
Promise.prototype.otherwise = Promise.prototype.caught;
Promise.prototype.exec      = function() {
  deprecate('knex.exec', 'knex.asCallback')
  return Promise.prototype.nodeify()
};

module.exports = Promise;
