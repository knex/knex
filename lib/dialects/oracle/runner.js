'use strict';

// Oracle Runner
// ------
var _        = require('lodash');
var inherits = require('inherits');
var Promise  = require('../../promise');
var Runner   = require('../../runner');
var helpers  = require('../../helpers');
var OracleQueryStream = require('./oracle-query-stream');

function Runner_Oracle(client, connection) {
  Runner.call(this, client, connection);
}
inherits(Runner_Oracle, Runner);

Runner_Oracle.prototype._stream = Promise.method(function (obj, stream, options) {
  var runner = this;
  obj.sql = this.client.positionBindings(obj.sql);
  return new Promise(function (resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    var queryStream = new OracleQueryStream(runner.connection, obj.sql, obj.bindings, options);
    queryStream.pipe(stream);
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_Oracle.prototype._query = Promise.method(function(obj) {
  var connection = this.connection;

  // convert ? params into positional bindings (:1)
  obj.sql = this.client.positionBindings(obj.sql);
  // convert boolean parameters into 0 or 1
  obj.bindings = this.client.preprocessBindings(obj.bindings) || [];

  if (!obj.sql) throw new Error('The query is empty');
  if (this.isDebugging()) this.debug(obj);
  return new Promise(function(resolver, rejecter) {
    connection.execute(obj.sql, obj.bindings, function(err, response) {
      if (err) return rejecter(err);

      if (obj.returning) {
        var rowIds = obj.outParams.map(function (v, i) {
          return response['returnParam' + (i ? i : '')];
        });

        return connection.execute(obj.returningSql, rowIds, function (err, subres) {
          if (err) return rejecter(err);
          obj.response = subres;
          resolver(obj);
        });
      } else {
        obj.response = response;
        resolver(obj);
      }
    });
  });
});

// Process the response as returned from the query.
Runner_Oracle.prototype.processResponse = function(obj) {
  var response = obj.response;
  var method   = obj.method;
  if (obj.output) return obj.output.call(this, response);

  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      response = helpers.skim(response);
      if (obj.method === 'pluck') response = _.pluck(response, obj.pluck);
      return obj.method === 'first' ? response[0] : response;
    case 'insert':
    case 'del':
    case 'update':
    case 'counter':
      if (obj.returning) {
        if (obj.returning.length > 1 || obj.returning[0] === '*') {
          return response;
        }
        // return an array with values if only one returning value was specified
        return _.flatten(_.map(response, _.values));
      }
      return response.updateCount;
    default:
      return response;
  }
};

module.exports = Runner_Oracle;
