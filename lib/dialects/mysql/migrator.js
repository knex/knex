// MySQL Migrator
// ------
module.exports = function(client) {

var Migrator = require('../../migrator');
var inherits = require('inherits');

function Migrator_MySQL() {
  Migrator.apply(this, arguments);
}
inherits(Migrator_MySQL, Migrator);

// Assign the newly extended `Migrator` constructor to the client object.
client.Migrator = Migrator_MySQL;

};