'use strict';

module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Promise  = require('../../promise');

var Runner = require('../../runner');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_FDB() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_FDB, Runner);

var FDBQueryStream;
Runner_FDB.prototype._stream = Promise.method(function(obj, stream, options) {
  FDBQueryStream = FDBQueryStream || require('pg-query-stream');
  var runner = this;
  var sql = obj.sql = this.client.positionBindings(obj.sql);
  if (this.isDebugging()) this.debug(obj);
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.query(new FDBQueryStream(sql, obj.bindings, options)).pipe(stream);
  });
});

// TODO: Could also retry for STALE_STATEMENT_CODE = '0A50A' if pg library
// allowed us to easily track preparation of statements.
// If the error code from the SQL Layer begins with 40, we should retry the query.
var RETRY_CODE = '40';
function shouldRetry(err) {
  return (err.code.substring(0, RETRY_CODE.length) === RETRY_CODE);
}

// Runs the query on the specified connection and retries upon failure when appropriate.
var retryQuery = function(connection, resolver, rejecter, obj, sql) {
  connection.query(sql, obj.bindings, function(err, response) {
    if (err) {
      if(shouldRetry(err))
        return retryQuery(connection, resolver, rejecter, obj, sql);
      else
        return rejecter(err);
    } else {
      obj.response = response;
      resolver(obj);
    }
  });
};

// Calls the query method that retries when appropriate, providing the bindings
// and any other necessary prep work.
Runner_FDB.prototype._query = Promise.method(function(obj) {
  var connection = this.connection;
  var sql = obj.sql = this.client.positionBindings(obj.sql);
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({text: sql}, obj.options);
  // Handle beginnings and endings of transactions appropriately
  if (sql === this._beginTransaction) this.currentTransaction = [];
  if (this.currentTransaction) this.currentTransaction[this.currentTransaction.length] = [obj, sql];
  var currentTransaction = this.currentTransaction;
  if (sql === this._commitTransaction || sql === this._rollbackTransaction)  this.currentTransaction = null;
  // Take this path if we're in a transaction, otherwise take the retryQuery path
  if (currentTransaction) {
    return new Promise(function(resolver, rejecter) {
      queryOnce(connection, resolver, rejecter, currentTransaction, obj, sql);
    });
  }
  else {
    return new Promise(function(resolver, rejecter) {
      retryQuery(connection, resolver, rejecter, obj, sql);
    });
  }
});

// Specifically for transactions: tries to execute query and retries entire transaction upon failure
var queryOnce = function(connection , resolver, rejecter, currentTransaction, obj, sql) {
  connection.query(sql, obj.bindings, function(err, response) {
    if (err) {
      if(shouldRetry(err))
        return retryTransaction(connection, resolver, rejecter, currentTransaction);
      else
        return rejecter(err);
    } else {
      obj.response = response;
      resolver(obj);
    }
  });
};

// Runs the transaction query on the specified connection and retries upon failure when appropriate.
var retryTransaction = function(connection, resolver, rejecter, currentTransaction) {
  currentTransaction.forEach(
    function(currentValue) {
      connection.query(currentValue[1], currentValue[0].bindings, function(err, response) {
        if (err) {
          if(shouldRetry(err))
            return retryTransaction(connection, resolver, rejecter, currentTransaction);
          else
            return rejecter(err);
        } else {
          currentValue[0].response = response;
          resolver(currentValue[0]);
        }
      });
    }
  );
};

// Ensures the response is returned in the same format as other clients.
Runner_FDB.prototype.processResponse = function(obj) {
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
client.Runner = Runner_FDB;

};
