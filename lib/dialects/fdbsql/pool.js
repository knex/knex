'use strict';

// FDB SQL Layer pool
// This file was adapted from the PostgreSQL pool

module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');

// Inherit from the `Pool` constructor's prototype.
function Pool_FDB() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_FDB, Pool);

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_FDB;

};
