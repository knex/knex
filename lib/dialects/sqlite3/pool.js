module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');

// Inherit from the `Pool` constructor's prototype.
function Pool_Sqlite3() {
  Pool.apply(this, arguments);
}
inherits(Pool_Sqlite3, Pool);

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_Sqlite3;

};