'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

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

var configOptions = ['isServer', 'stream', 'host', 'port', 'localAddress', 'socketPath', 'user', 'password', 'passwordSha1', 'database', 'connectTimeout', 'insecureAuth', 'supportBigNumbers', 'bigNumberStrings', 'decimalNumbers', 'dateStrings', 'debug', 'trace', 'stringifyObjects', 'timezone', 'flags', 'queryFormat', 'pool', 'ssl', 'multipleStatements', 'namedPlaceholders', 'typeCast', 'charsetNumber', 'compress'];

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.

// MySQL2 Client
// -------
function Client_MySQL2(config) {
  _mysql2.default.call(this, config);
}
(0, _inherits2.default)(Client_MySQL2, _mysql2.default);

(0, _assign3.default)(Client_MySQL2.prototype, {

  // The "dialect", for reference elsewhere.
  driverName: 'mysql2',

  transaction: function transaction() {
    return new (Function.prototype.bind.apply(_transaction2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  _driver: function _driver() {
    return require('mysql2');
  },
  validateConnection: function validateConnection() {
    return true;
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var connection = this.driver.createConnection((0, _pick3.default)(this.connectionSettings, configOptions));
    return new _bluebird2.default(function (resolver, rejecter) {
      connection.connect(function (err) {
        if (err) {
          return rejecter(err);
        }
        connection.on('error', function (err) {
          connection.__knex__disposed = err;
        });
        resolver(connection);
      });
    });
  },
  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    var rows = response[0];
    var fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
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

exports.default = Client_MySQL2;
module.exports = exports['default'];