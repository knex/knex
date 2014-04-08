module.exports = function(client) {

var Runner = require('../../runner');
var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_PG() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_PG, Runner);

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_PG.prototype.execute = Promise.method(function(connection, target, options) {
  if (!connection) throw new Error('No database connection exists for the query');
  if (options) sql = _.extend({text: sql}, options);
  return Promise.promisify(connection.query, connection)(sql, target.bindings);
});

// Ensures the response is returned in the same format as other clients.
Runner_PG.prototype.processResponse = function(target, method) {
  return function(resp) {
    var returning = runner.flags.returning;
    if (target.output) return target.output.call(runner, resp);
    if (resp.command === 'SELECT') return resp.rows;
    if (resp.command === 'INSERT' || (resp.command === 'UPDATE' && returning)) {
      var returns = [];
      for (var i = 0, l = resp.rows.length; i < l; i++) {
        var row = resp.rows[i];
        if (returning === '*' || _.isArray(returning)) {
          returns[i] = row;
        } else {
          returns[i] = row[returning];
        }
      }
      return returns;
    }
    if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
      return resp.rowCount;
    }
    return resp;
  };
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_PG;

};