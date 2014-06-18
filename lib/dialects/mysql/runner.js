// MySQL Runner
// ------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var Promise  = require('../../promise');
var Runner   = require('../../runner');
var helpers    = require('../../helpers');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_MySQL() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_MySQL, Runner);

// Grab a connection, run the query via the MySQL streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_MySQL.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.query(sql.sql, sql.bindings).stream(options).pipe(stream);
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_MySQL.prototype._query = Promise.method(function(obj) {
  var sql = obj.sql;
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({sql: sql}, obj.options);
  var connection = this.connection;
  if (!sql) throw new Error('The query is empty');
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, obj.bindings, function(err, rows, fields) {
      if (err) return rejecter(err);
      obj.response = [rows, fields];
      resolver(obj);
    });
  });
});

// Process the response as returned from the query.
Runner_MySQL.prototype.processResponse = function(obj) {
  var response = obj.response;
  var method   = obj.method;
  var rows     = response[0];
  var fields   = response[1];
  if (obj.output) return obj.output.call(this, rows, fields);
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      var resp = helpers.skim(rows);
      if (method === 'pluck') return _.pluck(resp, obj.pluck);
      return method === 'first' ? resp[0] : resp;
    case 'insert':
      return [rows.insertId];
    case 'del':
    case 'update':
    case 'counter':
      return rows.affectedRows;
    default:
      return response;
  }
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MySQL;

};