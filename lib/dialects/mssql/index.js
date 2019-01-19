'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(
  _possibleConstructorReturn2
);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _maxSafeInteger = require('babel-runtime/core-js/number/max-safe-integer');

var _maxSafeInteger2 = _interopRequireDefault(_maxSafeInteger);

var _lodash = require('lodash');

var _inherits4 = require('inherits');

var _inherits5 = _interopRequireDefault(_inherits4);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

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

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// MSSQL Client
// -------
var isArray = Array.isArray;

var SQL_INT4 = { MIN: -2147483648, MAX: 2147483647 };
var SQL_BIGINT_SAFE = { MIN: -9007199254740991, MAX: 9007199254740991 };

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
function Client_MSSQL() {
  var config =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
  // options object across all dialects.
  if (config && config.connection && config.connection.host) {
    config.connection.server = config.connection.host;
  }

  // mssql always creates pool :( lets try to unpool it as much as possible
  this.mssqlPoolSettings = {
    min: 1,
    max: 1,
    idleTimeoutMillis: _maxSafeInteger2.default,
    evictionRunIntervalMillis: 0,
  };

  _client2.default.call(this, config);
}
(0, _inherits5.default)(Client_MSSQL, _client2.default);

(0, _lodash.assign)(Client_MSSQL.prototype, {
  dialect: 'mssql',

  driverName: 'mssql',

  _driver: function _driver() {
    var tds = require('tedious');
    var mssqlTedious = require('mssql');
    var base = require('mssql/lib/base');

    // Monkey patch mssql's tedious driver _poolCreate method to fix problem with hanging acquire
    // connection, this should be removed when https://github.com/tediousjs/node-mssql/pull/614 is
    // merged and released.

    // Also since this dialect actually always uses tedious driver (msnodesqlv8 driver should be
    // required in different way), it might be better to use tedious directly, because mssql
    // driver uses always internally extra generic-pool and just adds one unnecessary layer of
    // indirection between database and knex and mssql driver has been lately without maintainer
    // (changing implementation to use tedious will be breaking change though).

    // TODO: remove mssql implementation all together and use tedious directly

    var mssqlVersion = require('mssql/package.json').version;
    if (mssqlVersion !== '4.1.0') {
      throw new Error(
        'This knex version does not support any other mssql version except 4.1.0 ' +
          '(knex patches bug in its implementation)'
      );
    }

    mssqlTedious.ConnectionPool.prototype.release = release;
    mssqlTedious.ConnectionPool.prototype._poolCreate = _poolCreate;

    // in some rare situations release is called when stream is interrupted, but
    // after pool is already destroyed
    function release(connection) {
      if (this.pool) {
        this.pool.release(connection);
      }
    }

    function _poolCreate() {
      var _this = this;

      // implementation is copy-pasted from https://github.com/tediousjs/node-mssql/pull/614
      return new base.Promise(function(resolve, reject) {
        var cfg = {
          userName: _this.config.user,
          password: _this.config.password,
          server: _this.config.server,
          options: (0, _assign2.default)({}, _this.config.options),
          domain: _this.config.domain,
        };

        cfg.options.database = _this.config.database;
        cfg.options.port = _this.config.port;
        cfg.options.connectTimeout =
          _this.config.connectionTimeout || _this.config.timeout || 15000;
        cfg.options.requestTimeout =
          _this.config.requestTimeout != null
            ? _this.config.requestTimeout
            : 15000;
        cfg.options.tdsVersion = cfg.options.tdsVersion || '7_4';
        cfg.options.rowCollectionOnDone = false;
        cfg.options.rowCollectionOnRequestCompletion = false;
        cfg.options.useColumnNames = false;
        cfg.options.appName = cfg.options.appName || 'node-mssql';

        // tedious always connect via tcp when port is specified
        if (cfg.options.instanceName) delete cfg.options.port;

        if (isNaN(cfg.options.requestTimeout))
          cfg.options.requestTimeout = 15000;
        if (cfg.options.requestTimeout === Infinity)
          cfg.options.requestTimeout = 0;
        if (cfg.options.requestTimeout < 0) cfg.options.requestTimeout = 0;

        if (_this.config.debug) {
          cfg.options.debug = {
            packet: true,
            token: true,
            data: true,
            payload: true,
          };
        }

        var tedious = new tds.Connection(cfg);

        // prevent calling resolve again on end event
        var alreadyResolved = false;
        function safeResolve(err) {
          if (!alreadyResolved) {
            alreadyResolved = true;
            resolve(err);
          }
        }

        function safeReject(err) {
          if (!alreadyResolved) {
            alreadyResolved = true;
            reject(err);
          }
        }

        tedious.once('end', function(evt) {
          safeReject(
            new base.ConnectionError(
              'Connection ended unexpectedly during connecting'
            )
          );
        });

        tedious.once('connect', function(err) {
          if (err) {
            err = new base.ConnectionError(err);
            return safeReject(err);
          }
          safeResolve(tedious);
        });

        tedious.on('error', function(err) {
          if (err.code === 'ESOCKET') {
            tedious.hasError = true;
            return;
          }

          _this.emit('error', err);
        });

        if (_this.config.debug) {
          tedious.on('debug', _this.emit.bind(_this, 'debug', tedious));
        }
      });
    }

    return mssqlTedious;
  },
  formatter: function formatter() {
    return new (Function.prototype.bind.apply(
      MSSQL_Formatter,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  transaction: function transaction() {
    return new (Function.prototype.bind.apply(
      _transaction2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  queryCompiler: function queryCompiler() {
    return new (Function.prototype.bind.apply(
      _compiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  schemaCompiler: function schemaCompiler() {
    return new (Function.prototype.bind.apply(
      _compiler4.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(
      _tablecompiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(
      _columncompiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    return value !== '*' ? '[' + value.replace(/\[/g, '[') + ']' : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var _this2 = this;

    return new _bluebird2.default(function(resolver, rejecter) {
      var settings = (0, _assign2.default)({}, _this2.connectionSettings);
      settings.pool = _this2.mssqlPoolSettings;

      var connection = new _this2.driver.ConnectionPool(settings);
      connection.connect(function(err) {
        if (err) {
          return rejecter(err);
        }
        connection.on('error', function(err) {
          connection.__knex__disposed = err;
        });
        resolver(connection);
      });
    });
  },
  validateConnection: function validateConnection(connection) {
    if (connection.connected === true) {
      return true;
    }

    return false;
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    return connection.close().catch(function(err) {
      // some times close will reject just because pool has already been destoyed
      // internally by the driver there is nothing we can do in this case
    });
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = -1;
    return sql.replace(/\?/g, function() {
      questionCount += 1;
      return '@p' + questionCount;
    });
  },

  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    var _this3 = this;

    options = options || {};
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _bluebird2.default(function(resolver, rejecter) {
      stream.on('error', function(err) {
        rejecter(err);
      });
      stream.on('end', resolver);
      var _obj = obj,
        sql = _obj.sql;

      if (!sql) return resolver();
      var req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          _this3._setReqInput(req, i, obj.bindings[i]);
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
    return new _bluebird2.default(function(resolver, rejecter) {
      var _obj2 = obj,
        sql = _obj2.sql;

      if (!sql) return resolver();
      var req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.query(sql, function(err, recordset) {
        if (err) {
          return rejecter(err);
        }
        obj.response = recordset.recordsets[0];
        resolver(obj);
      });
    });
  },

  // sets a request input parameter. Detects bigints and decimals and sets type appropriately.
  _setReqInput: function _setReqInput(req, i, binding) {
    if (typeof binding == 'number') {
      if (binding % 1 !== 0) {
        req.input('p' + i, this.driver.Decimal(38, 10), binding);
      } else if (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX) {
        if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
          throw new Error(
            'Bigint must be safe integer or must be passed as string, saw ' +
              binding
          );
        }
        req.input('p' + i, this.driver.BigInt, binding);
      } else {
        req.input('p' + i, this.driver.Int, binding);
      }
    } else {
      req.input('p' + i, binding);
    }
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
    var response = obj.response,
      method = obj.method;

    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (method === 'pluck') return (0, _lodash.map)(response, obj.pluck);
        return method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning === '@@rowcount') {
            return response[0][''];
          }

          if (
            (isArray(obj.returning) && obj.returning.length > 1) ||
            obj.returning[0] === '*'
          ) {
            return response;
          }
          // return an array with values if only one returning value was specified
          return (0, _lodash.flatten)(
            (0, _lodash.map)(response, _lodash.values)
          );
        }
        return response;
      default:
        return response;
    }
  },
});

var MSSQL_Formatter = (function(_Formatter) {
  (0, _inherits3.default)(MSSQL_Formatter, _Formatter);

  function MSSQL_Formatter() {
    (0, _classCallCheck3.default)(this, MSSQL_Formatter);
    return (0, _possibleConstructorReturn3.default)(
      this,
      _Formatter.apply(this, arguments)
    );
  }

  // Accepts a string or array of columns to wrap as appropriate.
  MSSQL_Formatter.prototype.columnizeWithPrefix = function columnizeWithPrefix(
    prefix,
    target
  ) {
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
})(_formatter2.default);

exports.default = Client_MSSQL;
module.exports = exports['default'];
