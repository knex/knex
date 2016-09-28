'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mysql = require('../mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Client_MariaSQL(config) {
  _mysql2.default.call(this, config);
}
// MariaSQL Client
// -------

(0, _inherits2.default)(Client_MariaSQL, _mysql2.default);

(0, _assign3.default)(Client_MariaSQL.prototype, {

  dialect: 'mariadb',

  driverName: 'mariasql',

  transaction: function transaction() {
    return new (Function.prototype.bind.apply(_transaction2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  _driver: function _driver() {
    return require('mariasql');
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var _this = this;

    return new _bluebird2.default(function (resolver, rejecter) {
      var connection = new _this.driver();
      connection.connect((0, _assign3.default)({ metadata: true }, _this.connectionSettings));
      connection.on('ready', function () {
        connection.removeAllListeners('error');
        resolver(connection);
      }).on('error', rejecter);
    });
  },
  validateConnection: function validateConnection(connection) {
    return connection.connected === true;
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    connection.removeAllListeners();
    connection.end();
  },


  // Return the database for the MariaSQL client.
  database: function database() {
    return this.connectionSettings.db;
  },


  // Grab a connection, run the query via the MariaSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, sql, stream) {
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
  _query: function _query(connection, obj) {
    var _this2 = this;

    var tz = this.connectionSettings.timezone || 'local';
    return new _bluebird2.default(function (resolver, rejecter) {
      if (!obj.sql) return resolver();
      var sql = _this2._formatQuery(obj.sql, obj.bindings, tz);
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
  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    var rows = response[0];
    var data = response[1];
    if (obj.output) return obj.output.call(runner, rows /*, fields*/);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        {
          var resp = helpers.skim(rows);
          if (method === 'pluck') return (0, _map3.default)(resp, obj.pluck);
          return method === 'first' ? resp[0] : resp;
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
    default:
      return value;
  }
}

function handleRow(row, metadata) {
  var keys = (0, _keys2.default)(metadata);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var type = metadata[key].type;

    row[key] = parseType(row[key], type);
  }
  return row;
}

function handleRows(rows, metadata) {
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    handleRow(row, metadata);
  }
  return rows;
}

exports.default = Client_MariaSQL;
module.exports = exports['default'];