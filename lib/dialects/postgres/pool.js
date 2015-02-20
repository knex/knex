'use strict';

module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');
var _        = require('lodash');

// Inherit from the `Pool` constructor's prototype.
function Pool_PG() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_PG, Pool);

Pool_PG.prototype.defaults = function() {
  return _.extend(Pool.prototype.defaults.call(this), {
    release: function(client, callback) { client.end(); callback(); }
  });
};

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_PG;

};
