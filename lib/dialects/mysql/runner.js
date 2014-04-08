module.exports = function(client) {

var Runner = require('../../runner');
var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_MySQL() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_MySQL, Runner);

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Client_MySQL.prototype.execute = Promise.method(function(connection, target, options) {
  if (!connection) throw new Error('No database connection exists for the query');
  if (options) target.sql = _.extend({sql: target.sql}, options);
  return Promise.promisify(connection.query, connection)(target.sql, target.bindings);
});

// Process the response as returned from the query.
Client_MySQL.prototype.processResponse = function(runner, target, method) {
  return function(resp) {
    var rows = resp[0];
    var fields = resp[1];
    if (target.output) return target.output.call(runner, rows, fields);
    if (method === 'raw') return resp;
    if (method === 'select') return utils.skim(rows);
    if (method === 'insert') return [rows.insertId];
    if (method === 'delete' || method === 'update') return rows.affectedRows;
    return rows;
  };
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MySQL;

};