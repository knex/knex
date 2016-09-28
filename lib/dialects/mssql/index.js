'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits4 = require('inherits');

var _inherits5 = _interopRequireDefault(_inherits4);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// MSSQL Client
// -------
var isArray = Array.isArray;


var SQL_INT4 = { MIN: -2147483648, MAX: 2147483647 };
var SQL_BIGINT_SAFE = { MIN: -9007199254740991, MAX: 9007199254740991 };

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
  // options object across all dialects.
  if (config && config.connection && config.connection.host) {
    config.connection.server = config.connection.host;
  }
  _client2.default.call(this, config);
}
(0, _inherits5.default)(Client_MSSQL, _client2.default);

(0, _assign3.default)(Client_MSSQL.prototype, {

  dialect: 'mssql',

  driverName: 'mssql',

  _driver: function _driver() {
    return require('mssql');
  },
  formatter: function formatter() {
    return new MSSQL_Formatter(this);
  },
  transaction: function transaction() {
    return new (Function.prototype.bind.apply(_transaction2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  queryCompiler: function queryCompiler() {
    return new (Function.prototype.bind.apply(_compiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  schemaCompiler: function schemaCompiler() {
    return new (Function.prototype.bind.apply(_compiler4.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(_tablecompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(_columncompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '[' + value.replace(/\[/g, '\[') + ']' : '*';
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var _this = this;

    return new _bluebird2.default(function (resolver, rejecter) {
      var connection = new _this.driver.Connection(_this.connectionSettings);
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
  validateConnection: function validateConnection(connection) {
    return connection.connected === true;
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    connection.close();
  },


  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = -1;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return '@p' + questionCount;
    });
  },


  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    var _this2 = this;

    options = options || {};
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    return new _bluebird2.default(function (resolver, rejecter) {
      stream.on('error', function (err) {
        rejecter(err);
      });
      stream.on('end', resolver);
      var _obj = obj;
      var sql = _obj.sql;

      if (!sql) return resolver();
      var req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          _this2._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.pipe(stream);
      req.query(sql);
    });
  },


  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    var client = this;
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    return new _bluebird2.default(function (resolver, rejecter) {
      var _obj2 = obj;
      var sql = _obj2.sql;

      if (!sql) return resolver();
      var req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.query(sql, function (err, recordset) {
        if (err) {
          return rejecter(err);
        }
        obj.response = recordset[0];
        resolver(obj);
      });
    });
  },


  // sets a request input parameter. Detects bigints and sets type appropriately.
  _setReqInput: function _setReqInput(req, i, binding) {
    if (typeof binding == 'number' && (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX)) {
      if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
        throw new Error('Bigint must be safe integer or must be passed as string, saw ' + binding);
      }
      req.input('p' + i, this.driver.BigInt, binding);
    } else {
      req.input('p' + i, binding);
    }
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
        if (method === 'pluck') return (0, _map3.default)(response, obj.pluck);
        return method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning === '@@rowcount') {
            return response[0][''];
          }

          if (isArray(obj.returning) && obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return (0, _flatten3.default)((0, _map3.default)(response, _values3.default));
        }
        return response;
      default:
        return response;
    }
  }
});

var MSSQL_Formatter = function (_Formatter) {
  (0, _inherits3.default)(MSSQL_Formatter, _Formatter);

  function MSSQL_Formatter() {
    (0, _classCallCheck3.default)(this, MSSQL_Formatter);
    return (0, _possibleConstructorReturn3.default)(this, _Formatter.apply(this, arguments));
  }

  // Accepts a string or array of columns to wrap as appropriate.
  MSSQL_Formatter.prototype.columnizeWithPrefix = function columnizeWithPrefix(prefix, target) {
    var columns = typeof target === 'string' ? [target] : target;
    var str = '',
        i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  };

  return MSSQL_Formatter;
}(_formatter2.default);

exports.default = Client_MSSQL;
module.exports = exports['default'];