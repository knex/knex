'use strict';

// SQLite3 Transaction
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_SQLite3() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_SQLite3, Transaction);

client.Transaction = Transaction_SQLite3;

};