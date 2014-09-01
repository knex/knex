'use strict';

module.exports = function(client) {

var Seeder = require('../../seed');
var inherits = require('inherits');

// Inherit from the `Seeder` constructor's prototype,
// so we can add the correct `then` method.
function Seeder_PG() {
  this.client = client;
  Seeder.apply(this, arguments);
}
inherits(Seeder_PG, Seeder);

// Assign the newly extended `Seeder` constructor to the client object.
client.Seeder = Seeder_PG;

};