'use strict';

module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_PG() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_PG, Transaction);

client.Transaction = Transaction_PG;

};