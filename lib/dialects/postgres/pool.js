'use strict';

module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');

// Inherit from the `Pool` constructor's prototype.
function Pool_PG() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_PG, Pool);

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_PG;

};