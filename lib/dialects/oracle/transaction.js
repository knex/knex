'use strict';

// Oracle Transaction
// ------

module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_Oracle() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_Oracle, Transaction);

client.Transaction = Transaction_Oracle;

};
