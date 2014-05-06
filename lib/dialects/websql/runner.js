// Runner
// -------
module.exports = function(client) {

var Promise  = require('../../promise');

// Require the SQLite3 Runner.
require('../sqlite3/runner')(client);
var Runner_SQLite3 = client.Runner;

var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_WebSQL() {
  this.client = client;
  Runner_SQLite3.apply(this, arguments);
}
inherits(Runner_WebSQL, Runner_SQLite3);

// Runs the query on the specified connection, providing the bindings and any other necessary prep work.
Runner_WebSQL.prototype._query = Promise.method(function(obj) {
  if (this.isDebugging()) this.debug(obj);
  var connection = this.connection;
  return new Promise(function(resolver, rejecter) {
    if (!connection) {
      return rejecter(new Error('No connection provided.'));
    }
    connection.executeSql(obj.sql, obj.bindings, function(trx, response) {
      obj.response = response;
      return resolver(obj);
    }, function(trx, err) {
      console.error(err);
      rejecter(err);
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_WebSQL.prototype.processResponse = function(obj) {
  var resp = obj.response;
  if (obj.method === 'select') {
    var results = [];
    for (var i = 0, l = resp.rows.length; i < l; i++) {
      results[i] = _.clone(resp.rows.item(i));
    }
    return results;
  } else if (obj.method === 'insert') {
    resp = [resp.insertId];
  } else if (obj.method === 'delete' || obj.method === 'update') {
    resp = resp.rowsAffected;
  }
  return resp;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_WebSQL;

};