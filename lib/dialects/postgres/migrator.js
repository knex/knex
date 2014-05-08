module.exports = function(client) {

var Migrator = require('../../migrate');
var inherits = require('inherits');

// Inherit from the `Migrator` constructor's prototype,
// so we can add the correct `then` method.
function Migrator_PG() {
  this.client = client;
  Migrator.apply(this, arguments);
}
inherits(Migrator_PG, Migrator);

// Assign the newly extended `Migrator` constructor to the client object.
client.Migrator = Migrator_PG;

};