'use strict';

var Promise = require('bluebird/js/main/promise')();

Promise.prototype.yield     = Promise.prototype.thenReturn;
Promise.prototype.ensure    = Promise.prototype.lastly;
Promise.prototype.otherwise = Promise.prototype.caught;
Promise.prototype.exec      = Promise.prototype.nodeify;

module.exports = Promise;
