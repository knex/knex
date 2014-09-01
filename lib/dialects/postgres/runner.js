'use strict';

module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Promise  = require('../../promise');

var Runner = require('../../runner');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_PG() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_PG, Runner);

var PGQueryStream;
Runner_PG.prototype._stream = Promise.method(function(obj, stream, options) {
  PGQueryStream = PGQueryStream || require('pg-query-stream');
  var runner = this;
  var sql = obj.sql = this.client.positionBindings(obj.sql);
  if (this.isDebugging()) this.debug(obj);
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.query(new PGQueryStream(sql, obj.bindings, options)).pipe(stream);
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_PG.prototype._query = Promise.method(function(obj) {
  var connection = this.connection;
  var sql = obj.sql = this.client.positionBindings(obj.sql);
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({text: sql}, obj.options);
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, obj.bindings, function(err, response) {
      if (err) return rejecter(err);
      obj.response = response;
      resolver(obj);
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_PG.prototype.processResponse = function(obj) {
  var resp = obj.response;
  if (obj.output) return obj.output.call(this, resp);
  if (obj.method === 'raw') return resp;
  var returning = obj.returning;
  if (resp.command === 'SELECT') {
    if (obj.method === 'first') return resp.rows[0];
    if (obj.method === 'pluck') return _.pluck(resp.rows, obj.pluck);
    return resp.rows;
  }
  if (returning) {
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

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_PG;

};