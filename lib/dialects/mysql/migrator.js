'use strict';

// MySQL Migrator
// ------
module.exports = function(client) {

var Migrator = require('../../migrate');
var inherits = require('inherits');

function Migrator_MySQL() {
  this.client = client;
  Migrator.apply(this, arguments);
}
inherits(Migrator_MySQL, Migrator);

client.Migrator = Migrator_MySQL;

};