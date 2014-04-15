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

var PGQueryStream;
Runner_PG.prototype._stream = function(stream, options) {
  PGQueryStream = PGQueryStream || require('pg-query-stream');
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
        runner.connection.query(new PGQueryStream(sql.sql, sql.bindings, options)).pipe(stream);
      });
    })
    .finally(this.cleanupConnection);
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_PG.prototype._query = Promise.method(function(obj) {
  var connection = this.connection;
  var sql = obj.sql;
  if (this._options) sql = _.extend({text: sql}, this._options);
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, target.bindings, function(err, response) {
      if (err) return rejecter(err);
      resolver(response);
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_PG.prototype.processResponse = function(obj) {
  if (obj.output) return obj.output.call(this, obj.response);
  // if (resp.command === 'SELECT') return resp.rows;
  // if (resp.command === 'INSERT' || (resp.command === 'UPDATE' && returning)) {
  //   var returns = [];
  //   for (var i = 0, l = resp.rows.length; i < l; i++) {
  //     var row = resp.rows[i];
  //     if (returning === '*' || _.isArray(returning)) {
  //       returns[i] = row;
  //     } else {
  //       returns[i] = row[returning];
  //     }
  //   }
  //   return returns;
  // }
  // if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
  //   return resp.rowCount;
  // }
  // return resp;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_PG;

};