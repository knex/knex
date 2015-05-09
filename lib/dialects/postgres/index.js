
// PostgreSQL
// -------
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Client = require('../../client');
var Promise = require('../../promise');
var utils = require('./utils');
var assign = require('lodash/object/assign');

var QueryCompiler = require('./query/compiler');
var ColumnCompiler = require('./schema/columncompiler');
var TableCompiler = require('./schema/tablecompiler');
var SchemaCompiler = require('./schema/compiler');
var PGQueryStream;

function Client_PG(config) {
  Client.apply(this, arguments);
  if (config.returning) {
    this.defaultReturning = config.returning;
  }
}
inherits(Client_PG, Client);

assign(Client_PG.prototype, {

  QueryCompiler: QueryCompiler,

  ColumnCompiler: ColumnCompiler,

  SchemaCompiler: SchemaCompiler,

  TableCompiler: TableCompiler,

  dialect: 'postgresql',

  driverName: 'pg',

  _driver: function _driver() {
    return require('pg');
  },

  wrapIdentifier: function wrapIdentifier(value) {
    if (value === '*') return value;
    var matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
    return '"' + value.replace(/"/g, '""') + '"';
  },

  // Prep the bindings as needed by PostgreSQL.
  prepBindings: function prepBindings(bindings, tz) {
    return _.map(bindings, function (binding) {
      return utils.prepareValue(binding, tz);
    });
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new Promise(function (resolver, rejecter) {
      var connection = new client.driver.Client(client.connectionSettings);
      connection.connect(function (err, connection) {
        if (err) return rejecter(err);
        connection.on('error', client.__endConnection.bind(client, connection));
        connection.on('end', client.__endConnection.bind(client, connection));
        if (!client.version) {
          return client.checkVersion(connection).then(function (version) {
            client.version = version;
            resolver(connection);
          });
        }
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.end();
    cb();
  },

  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion: function checkVersion(connection) {
    return new Promise(function (resolver, rejecter) {
      connection.query('select version();', function (err, resp) {
        if (err) return rejecter(err);
        resolver(/^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1]);
      });
    });
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function () {
      questionCount++;
      return '$' + questionCount;
    });
  },

  _stream: function _stream(connection, obj, stream, options) {
    PGQueryStream = process.browser ? undefined : require('pg-query-stream');
    var sql = obj.sql = this.positionBindings(obj.sql);
    return new Promise(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      connection.query(new PGQueryStream(sql, obj.bindings, options)).pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    var sql = obj.sql = this.positionBindings(obj.sql);
    if (obj.options) sql = _.extend({ text: sql }, obj.options);
    return new Promise(function (resolver, rejecter) {
      connection.query(sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;
        resolver(obj);
      });
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    var resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
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
        if (returning === '*' || Array.isArray(returning)) {
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
  },

  __endConnection: function __endConnection(connection) {
    if (!connection || connection.__knex__disposed) return;
    if (this.pool) {
      connection.__knex__disposed = true;
      this.pool.destroy(connection);
    }
  } });

module.exports = Client_PG;