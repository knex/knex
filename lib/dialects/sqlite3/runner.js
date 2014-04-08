module.exports = function(client) {

var Runner = require('../../runner');
var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_SQLite3() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_SQLite3, Runner);

Runner_SQLite3.prototype.beginTransaction = 'begin transaction;';

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_SQLite3;

};