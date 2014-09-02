'use strict';

// Runner
// -------
module.exports = function(client) {

var _        = require('lodash');
var Promise  = require('../../promise');
var Runner   = require('../../runner');
var helpers  = require('../../helpers');

var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_SQLite3() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_SQLite3, Runner);

Runner_SQLite3.prototype._beginTransaction = 'begin transaction;';

// Runs the query on the specified connection, providing the bindings and any other necessary prep work.
Runner_SQLite3.prototype._query = Promise.method(function(obj) {
  var method = obj.method;
  if (this.isDebugging()) this.debug(obj);
  var callMethod;
  switch (method) {
    case 'insert':
    case 'update':
    case 'counter':
    case 'del':
      callMethod = 'run';
      break;
    default:
      callMethod = 'all';
  }
  var connection = this.connection;
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

// Sounds like .each doesn't work great for
Runner_SQLite3.prototype._stream = Promise.method(function(sql, stream, options) {
  /*jshint unused: false*/
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    return runner.query(sql).map(function(row) {
      stream.write(row);
    }).catch(function(err) {
      stream.emit('error', err);
    }).then(function() {
      stream.end();
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_SQLite3.prototype.processResponse = function(obj) {
  var ctx      = obj.context;
  var response = obj.response;
  if (obj.output) return obj.output.call(this, response);
  switch (obj.method) {
    case 'select':
    case 'pluck':
    case 'first':
      response = helpers.skim(response);
      if (obj.method === 'pluck') response = _.pluck(response, obj.pluck);
      return obj.method === 'first' ? response[0] : response;
    case 'insert':
      return [ctx.lastID];
    case 'del':
    case 'update':
    case 'counter':
      return ctx.changes;
    default:
      return response;
  }
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_SQLite3;

};
