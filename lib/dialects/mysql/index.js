
// MySQL Client
// -------
'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');

var Client = require('../../client');
var Promise = require('../../promise');
var helpers = require('../../helpers');

var Transaction = require('./transaction');
var QueryCompiler = require('./query/compiler');
var SchemaCompiler = require('./schema/compiler');
var TableCompiler = require('./schema/tablecompiler');
var ColumnCompiler = require('./schema/columncompiler');
var pluck = require('lodash/collection/pluck');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  Client.call(this, config);
}
inherits(Client_MySQL, Client);

assign(Client_MySQL.prototype, {

  dialect: 'mysql',

  driverName: 'mysql',

  _driver: function _driver() {
    return require('mysql');
  },

  QueryCompiler: QueryCompiler,

  SchemaCompiler: SchemaCompiler,

  TableCompiler: TableCompiler,

  ColumnCompiler: ColumnCompiler,

  Transaction: Transaction,

  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var connection = this.driver.createConnection(this.connectionSettings);
    return new Promise(function (resolver, rejecter) {
      connection.connect(function (err) {
        if (err) return rejecter(err);
        connection.on('error', connectionErrorHandler.bind(null, client, connection));
        connection.on('end', connectionErrorHandler.bind(null, client, connection));
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.end(cb);
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    options = options || {};
    return new Promise(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise(function (resolver, rejecter) {
      var sql = obj.sql;
      if (!sql) return resolver();
      if (obj.options) sql = assign({ sql: sql }, obj.options);
      connection.query(sql, obj.bindings, function (err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
    var response = obj.response;
    var method = obj.method;
    var rows = response[0];
    var fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        var resp = helpers.skim(rows);
        if (method === 'pluck') return pluck(resp, obj.pluck);
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
  }

});

// MySQL Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

module.exports = Client_MySQL;