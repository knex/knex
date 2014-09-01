'use strict';

// MySQL Pool
// ------
module.exports = function(client) {

var inherits = require('inherits');
var Pool = require('../../pool');

function Pool_MySQL() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_MySQL, Pool);

client.Pool = Pool_MySQL;

};