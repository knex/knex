// Runner
// -------
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

// Runs the query on the specified connection, providing the bindings and any other necessary prep work.
Runner_SQLite3.prototype._query = Promise.method(function(obj) {
  var method = obj.method;
  var callMethod = (method === 'insert' || method === 'update' || method === 'delete') ? 'run' : 'all';
  return new Promise(function(resolver, rejecter) {
    if (!connection || !connection[callMethod]) {
      return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
    }
    connection[callMethod](obj.sql, obj.bindings, function(err, response) {
      if (err) return rejecter(err);
      obj.response = response;

      // We need the context here, as it contains
      // the "this.lastID" or "this.changes"
      obj.context  = this;
      return resolver(obj);
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_SQLite3.prototype.processResponse = function(obj) {
  var ctx      = obj.context;
  var response = obj.response;
  if (obj.output) return obj.output.call(runner, response);
  if (method === 'select') {
    response = helpers.skim(response);
  } else if (method === 'insert') {
    response = [ctx.lastID];
  } else if (method === 'delete' || method === 'update') {
    response = ctx.changes;
  }
  return response;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_SQLite3;

};