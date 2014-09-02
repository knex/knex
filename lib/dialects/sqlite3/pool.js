'use strict';

module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');
var _        = require('lodash');

// Inherit from the `Pool` constructor's prototype.
function Pool_SQLite3() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_SQLite3, Pool);

Pool_SQLite3.prototype.defaults = function() {
  return _.extend(Pool.prototype.defaults.call(this), {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  });
};

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_SQLite3;

};