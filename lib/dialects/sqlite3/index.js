
// SQLite3
// -------
'use strict';

var Promise = require('../../promise');

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var pluck = require('lodash/collection/pluck');

var Client = require('../../client');
var helpers = require('../../helpers');

var QueryCompiler = require('./query/compiler');
var SchemaCompiler = require('./schema/compiler');
var ColumnCompiler = require('./schema/columncompiler');
var TableCompiler = require('./schema/tablecompiler');
var SQLite3_DDL = require('./schema/ddl');

function Client_SQLite3(config) {
  Client.call(this, config);
}
inherits(Client_SQLite3, Client);

assign(Client_SQLite3.prototype, {

  dialect: 'sqlite3',

  driverName: 'sqlite3',

  _driver: function _driver() {
    return require('sqlite3');
  },

  SchemaCompiler: SchemaCompiler,

  QueryCompiler: QueryCompiler,

  ColumnCompiler: ColumnCompiler,

  TableCompiler: TableCompiler,

  ddl: function ddl(compiler, pragma, connection) {
    return new SQLite3_DDL(this, compiler, pragma, connection);
  },

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new Promise(function (resolve, reject) {
      var db = new client.driver.Database(client.connectionSettings.filename, function (err) {
        if (err) return reject(err);
        resolve(db);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.close();
    cb();
  },

  // Runs the query on the specified connection, providing the bindings and any other necessary prep work.
  _query: function _query(connection, obj) {
    var method = obj.method;
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
    return new Promise(function (resolver, rejecter) {
      if (!connection || !connection[callMethod]) {
        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
      }
      connection[callMethod](obj.sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;

        // We need the context here, as it contains
        // the "this.lastID" or "this.changes"
        obj.context = this;
        return resolver(obj);
      });
    });
  },

  _stream: function _stream(connection, sql, stream) {
    var client = this;
    return new Promise(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      return client._query(connection, sql).then(function (obj) {
        return obj.response;
      }).map(function (row) {
        stream.write(row);
      })['catch'](function (err) {
        stream.emit('error', err);
      }).then(function () {
        stream.end();
      });
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    var ctx = obj.context;
    var response = obj.response;
    if (obj.output) return obj.output.call(runner, response);
    switch (obj.method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (obj.method === 'pluck') response = pluck(response, obj.pluck);
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
  },

  poolDefaults: function poolDefaults(config) {
    return assign(Client.prototype.poolDefaults.call(this, config), {
      min: 1,
      max: 1
    });
  }

});

module.exports = Client_SQLite3;