'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mysql = require('../mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Client_MariaSQL(config) {
  _mysql2.default.call(this, config);
}
// MariaSQL Client
// -------

(0, _inherits2.default)(Client_MariaSQL, _mysql2.default);

(0, _lodash.assign)(Client_MariaSQL.prototype, {

  dialect: 'mariadb',

  driverName: 'mariasql',

  transaction() {
    return new _transaction2.default(this, ...arguments);
  },

  _driver() {
    return require('mariasql');
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new _bluebird2.default((resolver, rejecter) => {
      const connection = new this.driver();
      connection.connect((0, _lodash.assign)({ metadata: true }, this.connectionSettings));
      connection.on('ready', function () {
        resolver(connection);
      }).on('error', err => {
        connection.__knex__disposed = err;
        rejecter(err);
      });
    });
  },

  validateConnection(connection) {
    if (connection.connected === true) {
      return true;
    }

    return false;
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    connection.removeAllListeners();
    let closed = _bluebird2.default.resolve();
    if (connection.connected || connection.connecting) {
      closed = new _bluebird2.default(resolve => {
        connection.once('close', resolve);
      });
    }
    connection.end();
    return closed;
  },

  // Return the database for the MariaSQL client.
  database() {
    return this.connectionSettings.db;
  },

  // Grab a connection, run the query via the MariaSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, sql, stream) {
    return new _bluebird2.default(function (resolver, rejecter) {
      connection.query(sql.sql, sql.bindings).on('result', function (res) {
        res.on('error', rejecter).on('end', function () {
          resolver(res.info);
        }).on('data', function (data) {
          stream.write(handleRow(data, res.info.metadata));
        });
      }).on('error', rejecter);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    const tz = this.connectionSettings.timezone || 'local';
    return new _bluebird2.default((resolver, rejecter) => {
      if (!obj.sql) return resolver();
      const sql = this._formatQuery(obj.sql, obj.bindings, tz);
      connection.query(sql, function (err, rows) {
        if (err) {
          return rejecter(err);
        }
        handleRows(rows, rows.info.metadata);
        obj.response = [rows, rows.info];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    const { response } = obj;
    const { method } = obj;
    const rows = response[0];
    const data = response[1];
    if (obj.output) return obj.output.call(runner, rows /*, fields*/);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        {
          if (method === 'pluck') return (0, _lodash.map)(rows, obj.pluck);
          return method === 'first' ? rows[0] : rows;
        }
      case 'insert':
        return [data.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return parseInt(data.affectedRows, 10);
      default:
        return response;
    }
  }

});

function parseType(value, type) {
  switch (type) {
    case 'DATETIME':
    case 'TIMESTAMP':
      return new Date(value);
    case 'INTEGER':
      return parseInt(value, 10);
    case 'FLOAT':
      return parseFloat(value);
    default:
      return value;
  }
}

function handleRow(row, metadata) {
  const keys = (0, _keys2.default)(metadata);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const { type } = metadata[key];
    row[key] = parseType(row[key], type);
  }
  return row;
}

function handleRows(rows, metadata) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    handleRow(row, metadata);
  }
  return rows;
}

exports.default = Client_MariaSQL;
module.exports = exports['default'];