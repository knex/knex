'use strict';

// FDB SQL Layer seeder
// This file was adapted from the PostgreSQL seeder

module.exports = function(client) {

var Seeder = require('../../seed');
var inherits = require('inherits');

// Inherit from the `Seeder` constructor's prototype,
// so we can add the correct `then` method.
function Seeder_FDB() {
  this.client = client;
  Seeder.apply(this, arguments);
}
inherits(Seeder_FDB, Seeder);

// Assign the newly extended `Seeder` constructor to the client object.
client.Seeder = Seeder_FDB;

};
