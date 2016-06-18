
// Firebird Client
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
var Formatter = require('./formatter');
var TableCompiler = require('./schema/tablecompiler');
var ColumnCompiler = require('./schema/columncompiler');
var pluck = require('lodash/collection/pluck');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Firebird(config) {
  Client.call(this, config);
}
inherits(Client_Firebird, Client);

assign(Client_Firebird.prototype, {

  dialect: 'firebird',

  driverName: 'node-firebird',

  _driver: function _driver() {
    return require('node-firebird');
  },

  QueryCompiler: QueryCompiler,

  SchemaCompiler: SchemaCompiler,

  TableCompiler: TableCompiler,

  ColumnCompiler: ColumnCompiler,

  Transaction: Transaction,

  Formatter: Formatter,

  wrapIdentifier: function wrapIdentifier(value) {
    if (value === '*') return value;
    var matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
    return '' + value.replace(/"/g, '""') + '';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var driver = client.driver;
    var connectionSettings = client.connectionSettings;

    return new Promise(function (resolver, rejecter) {
      driver.attach(connectionSettings, function (err, db) {
        if (err) return rejecter(err);
        db.on('error', connectionErrorHandler.bind(null, client, db));
        db.on('end', connectionErrorHandler.bind(null, client, db));
        resolver(db);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
        if (typeof cb.detach === "function"){
        cb.detach();
        }
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise(function (resolver, rejecter) {
      var sql = obj.sql;
      if (!sql) return resolver();

      connection.query(sql, obj.bindings, function (err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields, obj.bindings];
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
    var bindings = response[2];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        var resp = helpers.skim(rows);
        if (method === 'pluck') return pluck(resp, obj.pluck);
        return method === 'first' ? resp[0] : resp;
      case 'insert':
        return bindings;
      case 'del':
      case 'update':
      case 'counter':
        if (rows && rows.affectedRows) {
            rows.affectedRows
        } else {
            rows = {}
            rows.affectedRows = [0]
        }      
        return rows.affectedRows;
      default:
        return bindings;
    }
  }

});

// Firebird Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

module.exports = Client_Firebird;