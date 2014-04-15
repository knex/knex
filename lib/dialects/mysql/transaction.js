// MySQL Transaction
// ------
module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_MySQL() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_MySQL, Transaction);

client.Transaction = Transaction_MySQL;

};