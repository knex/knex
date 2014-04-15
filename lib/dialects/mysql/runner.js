// MySQL Runner
// ------
module.exports = function(client) {

var Promise = require('../../promise');
var Runner  = require('../../runner');
var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_MySQL() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_MySQL, Runner);

// Grab a connection, run the query via the MySQL streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_MySQL.prototype._stream = function(stream, options) {
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function() {
      var sql = this.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if (_.isArray(sql)) {
        stream.emit('error', err);
        throw err;
      }
      return sql;
    }).then(function(sql) {
      var runner = this;
      return new Promise(function(resolver, rejecter) {
        stream.on('error', rejecter);
        stream.on('end', resolver);
        runner.connection.query(sql.sql, sql.bindings).stream(options).pipe(stream);
      });
    })
    .finally(this.cleanupConnection);
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_MySQL.prototype._query = Promise.method(function(obj) {
  var sql = obj.sql;
  if (this._options) sql = _.extend({sql: sql}, this._options);
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, target.bindings, function(err, response) {
      if (err) return rejecter(err);
      resolver(response);
    });
  });
});

// Process the response as returned from the query.
Runner_MySQL.prototype.processResponse = function(obj) {
  var response = obj.response;
  var rows     = response[0];
  var fields   = response[1];
  var resp;
  if (target.output) {
    resp = target.output.call(runner, rows, fields);
  } else if (method === 'select') {
    resp = utils.skim(rows);
  } else if (method === 'insert') {
    resp = [rows.insertId];
  } else if (method === 'delete' || method === 'update') {
    resp = rows.affectedRows;
  } else {
    resp = response;
  }
  return resp;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MySQL;

};