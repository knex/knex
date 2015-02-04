'use strict';

module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_FDB() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_FDB, Transaction);

client.Transaction = Transaction_FDB;

};
