module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');

// Inherit from the `Pool` constructor's prototype.
function Pool_SQLite3() {
  Pool.apply(this, arguments);
}
inherits(Pool_SQLite3, Pool);

// return {
//   max: 1,
//   min: 1,
//   destroy: function(client) { client.close(); }
// };


// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_SQLite3;

};