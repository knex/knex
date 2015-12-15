
// MSSQL Client
// -------
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var assign = require('lodash/object/assign');

var Formatter = require('./formatter');
var Client = require('../../client');
var Promise = require('../../promise');
var helpers = require('../../helpers');

var Transaction = require('./transaction');
var QueryCompiler = require('./query/compiler');
var SchemaCompiler = require('./schema/compiler');
var TableCompiler = require('./schema/tablecompiler');
var ColumnCompiler = require('./schema/columncompiler');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  Client.call(this, config);
}
inherits(Client_MSSQL, Client);

assign(Client_MSSQL.prototype, {

  dialect: 'mssql',

  driverName: 'mssql',

  _driver: function _driver() {
    return require('mssql');
  },

  Transaction: Transaction,

  Formatter: Formatter,

  QueryCompiler: QueryCompiler,

  SchemaCompiler: SchemaCompiler,

  TableCompiler: TableCompiler,

  ColumnCompiler: ColumnCompiler,

  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '[' + value.replace(/\[/g, '\[') + ']' : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var connection = new this.driver.Connection(this.connectionSettings);
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
    connection.close(cb);
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = -1;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return '@p' + questionCount;
    });
  },

  prepBindings: function prepBindings(bindings) {
    return _.map(bindings, function (value) {
      if (value === undefined) {
        return this.valueForUndefined;
      }
      return value;
    }, this);
  },

  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    options = options || {};
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    obj.bindings = this.prepBindings(obj.bindings) || [];
    return new Promise(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      var sql = obj.sql;
      if (!sql) return resolver();
      if (obj.options) sql = assign({ sql: sql }, obj.options).sql;
      var req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          req.input('p' + i, obj.bindings[i]);
        }
      }
      req.pipe(stream);
      req.query(sql);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    obj.bindings = this.prepBindings(obj.bindings) || [];
    return new Promise(function (resolver, rejecter) {
      var sql = obj.sql;
      if (!sql) return resolver();
      if (obj.options) sql = assign({ sql: sql }, obj.options).sql;
      var req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          req.input('p' + i, obj.bindings[i]);
        }
      }
      req.query(sql, function (err, recordset) {
        if (err) return rejecter(err);
        obj.response = recordset[0];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
    var response = obj.response;
    var method = obj.method;
    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (method === 'pluck') return _.pluck(response, obj.pluck);
        return method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning === '@@rowcount') {
            return response[0][''];
          }
          if (Array.isArray(obj.returning) && obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return _.flatten(_.map(response, _.values));
        }
        return response;
      default:
        return response;
    }
  }

});

// MSSQL Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

module.exports = Client_MSSQL;