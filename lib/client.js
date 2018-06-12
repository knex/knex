'use strict';

exports.__esModule = true;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _ref2 = require('./ref');

var _ref3 = _interopRequireDefault(_ref2);

var _runner = require('./runner');

var _runner2 = _interopRequireDefault(_runner);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _builder = require('./query/builder');

var _builder2 = _interopRequireDefault(_builder);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _builder3 = require('./schema/builder');

var _builder4 = _interopRequireDefault(_builder3);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _tablebuilder = require('./schema/tablebuilder');

var _tablebuilder2 = _interopRequireDefault(_tablebuilder);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columnbuilder = require('./schema/columnbuilder');

var _columnbuilder2 = _interopRequireDefault(_columnbuilder);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _tarn = require('tarn');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

var _string = require('./query/string');

var _lodash = require('lodash');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:client');
var debugQuery = require('debug')('knex:query');
var debugBindings = require('debug')('knex:bindings');

// The base client provides the general structure
// for a dialect specific client object.
function Client() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.config = config;
  this.logger = new _logger2.default(config);

  //Client is a required field, so throw error if it's not supplied.
  //If 'this.dialect' is set, then this is a 'super()' call, in which case
  //'client' does not have to be set as it's already assigned on the client prototype.
  if (!this.config.client && !this.dialect) {
    throw new Error('knex: Required configuration option \'client\' is missing.');
  }

  this.connectionSettings = (0, _lodash.cloneDeep)(config.connection || {});
  if (this.driverName && config.connection) {
    this.initializeDriver();
    if (!config.pool || config.pool && config.pool.max !== 0) {
      this.initializePool(config);
    }
  }
  this.valueForUndefined = this.raw('DEFAULT');
  if (config.useNullAsDefault) {
    this.valueForUndefined = null;
  }
}
(0, _inherits2.default)(Client, _events.EventEmitter);

(0, _lodash.assign)(Client.prototype, {
  formatter: function formatter(builder) {
    return new _formatter2.default(this, builder);
  },
  queryBuilder: function queryBuilder() {
    return new _builder2.default(this);
  },
  queryCompiler: function queryCompiler(builder) {
    return new _compiler2.default(this, builder);
  },
  schemaBuilder: function schemaBuilder() {
    return new _builder4.default(this);
  },
  schemaCompiler: function schemaCompiler(builder) {
    return new _compiler4.default(this, builder);
  },
  tableBuilder: function tableBuilder(type, tableName, fn) {
    return new _tablebuilder2.default(this, type, tableName, fn);
  },
  tableCompiler: function tableCompiler(tableBuilder) {
    return new _tablecompiler2.default(this, tableBuilder);
  },
  columnBuilder: function columnBuilder(tableBuilder, type, args) {
    return new _columnbuilder2.default(this, tableBuilder, type, args);
  },
  columnCompiler: function columnCompiler(tableBuilder, columnBuilder) {
    return new _columncompiler2.default(this, tableBuilder, columnBuilder);
  },
  runner: function runner(builder) {
    return new _runner2.default(this, builder);
  },
  transaction: function transaction(container, config, outerTx) {
    return new _transaction2.default(this, container, config, outerTx);
  },
  raw: function raw() {
    var _ref;

    return (_ref = new _raw2.default(this)).set.apply(_ref, arguments);
  },
  ref: function ref() {
    return new (Function.prototype.bind.apply(_ref3.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  _formatQuery: function _formatQuery(sql, bindings, timeZone) {
    var _this = this;

    bindings = bindings == null ? [] : [].concat(bindings);
    var index = 0;
    return sql.replace(/\\?\?/g, function (match) {
      if (match === '\\?') {
        return '?';
      }
      if (index === bindings.length) {
        return match;
      }
      var value = bindings[index++];
      return _this._escapeBinding(value, { timeZone: timeZone });
    });
  },


  _escapeBinding: (0, _string.makeEscape)({
    escapeString: function escapeString(str) {
      return '\'' + str.replace(/'/g, "''") + '\'';
    }
  }),

  query: function query(connection, obj) {
    var _this2 = this;

    if (typeof obj === 'string') obj = { sql: obj };
    obj.bindings = this.prepBindings(obj.bindings);

    var __knexUid = connection.__knexUid,
        __knexTxId = connection.__knexTxId;


    this.emit('query', (0, _lodash.assign)({ __knexUid: __knexUid, __knexTxId: __knexTxId }, obj));
    debugQuery(obj.sql, __knexTxId);
    debugBindings(obj.bindings, __knexTxId);

    obj.sql = this.positionBindings(obj.sql);

    return this._query(connection, obj).catch(function (err) {
      err.message = _this2._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message;
      _this2.emit('query-error', err, (0, _lodash.assign)({ __knexUid: __knexUid, __knexTxId: __knexTxId }, obj));
      throw err;
    });
  },
  stream: function stream(connection, obj, _stream, options) {
    if (typeof obj === 'string') obj = { sql: obj };
    obj.bindings = this.prepBindings(obj.bindings);

    var __knexUid = connection.__knexUid,
        __knexTxId = connection.__knexTxId;


    this.emit('query', (0, _lodash.assign)({ __knexUid: __knexUid, __knexTxId: __knexTxId }, obj));
    debugQuery(obj.sql, __knexTxId);
    debugBindings(obj.bindings, __knexTxId);

    obj.sql = this.positionBindings(obj.sql);

    return this._stream(connection, obj, _stream, options);
  },
  prepBindings: function prepBindings(bindings) {
    return bindings;
  },
  positionBindings: function positionBindings(sql) {
    return sql;
  },
  postProcessResponse: function postProcessResponse(resp, queryContext) {
    if (this.config.postProcessResponse) {
      return this.config.postProcessResponse(resp, queryContext);
    }
    return resp;
  },
  wrapIdentifier: function wrapIdentifier(value, queryContext) {
    return this.customWrapIdentifier(value, this.wrapIdentifierImpl, queryContext);
  },
  customWrapIdentifier: function customWrapIdentifier(value, origImpl, queryContext) {
    if (this.config.wrapIdentifier) {
      return this.config.wrapIdentifier(value, origImpl, queryContext);
    }
    return origImpl(value);
  },
  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    return value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*';
  },
  initializeDriver: function initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      this.logger.error('Knex: run\n$ npm install ' + this.driverName + ' --save\n' + e.stack);
      process.exit(1);
    }
  },
  poolDefaults: function poolDefaults() {
    return { min: 2, max: 10, propagateCreateError: true };
  },
  getPoolSettings: function getPoolSettings(poolConfig) {
    var _this3 = this;

    poolConfig = (0, _lodash.defaults)({}, poolConfig, this.poolDefaults());

    ['maxWaitingClients', 'testOnBorrow', 'fifo', 'priorityRange', 'autostart', 'evictionRunIntervalMillis', 'numTestsPerRun', 'softIdleTimeoutMillis', 'Promise'].forEach(function (option) {
      if (option in poolConfig) {
        _this3.logger.warn(['Pool config option "' + option + '" is no longer supported.', 'See https://github.com/Vincit/tarn.js for possible pool config options.'].join(' '));
      }
    });

    var timeouts = [this.config.acquireConnectionTimeout || 60000, poolConfig.acquireTimeoutMillis].filter(function (timeout) {
      return timeout !== undefined;
    });

    // acquire connection timeout can be set on config or config.pool
    // choose the smallest, positive timeout setting and set on poolConfig
    poolConfig.acquireTimeoutMillis = Math.min.apply(Math, timeouts);

    return (0, _assign2.default)(poolConfig, {
      create: function create() {
        return _this3.acquireRawConnection().tap(function (connection) {
          connection.__knexUid = (0, _lodash.uniqueId)('__knexUid');

          if (poolConfig.afterCreate) {
            return _bluebird2.default.promisify(poolConfig.afterCreate)(connection);
          }
        });
      },

      destroy: function destroy(connection) {
        if (poolConfig.beforeDestroy) {
          _this3.logger.warn('\n            beforeDestroy is deprecated, please open an issue if you use this\n            to discuss alternative apis\n          ');

          poolConfig.beforeDestroy(connection, function () {});
        }

        if (connection !== void 0) {
          return _this3.destroyRawConnection(connection);
        }
      },

      validate: function validate(connection) {
        if (connection.__knex__disposed) {
          _this3.logger.warn('Connection Error: ' + connection.__knex__disposed);
          return false;
        }

        return _this3.validateConnection(connection);
      }
    });
  },
  initializePool: function initializePool(config) {
    if (this.pool) {
      this.logger.warn('The pool has already been initialized');
      return;
    }

    this.pool = new _tarn.Pool(this.getPoolSettings(config.pool));
  },
  validateConnection: function validateConnection(connection) {
    return true;
  },


  // Acquire a connection from the pool.
  acquireConnection: function acquireConnection() {
    var _this4 = this;

    if (!this.pool) {
      return _bluebird2.default.reject(new Error('Unable to acquire a connection'));
    }

    return _bluebird2.default.try(function () {
      return _this4.pool.acquire().promise;
    }).tap(function (connection) {
      debug('acquired connection from pool: %s', connection.__knexUid);
    }).catch(_tarn.TimeoutError, function () {
      throw new _bluebird2.default.TimeoutError('Knex: Timeout acquiring a connection. The pool is probably full. ' + 'Are you missing a .transacting(trx) call?');
    });
  },


  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection: function releaseConnection(connection) {
    debug('releasing connection to pool: %s', connection.__knexUid);
    var didRelease = this.pool.release(connection);

    if (!didRelease) {
      debug('pool refused connection: %s', connection.__knexUid);
    }

    return _bluebird2.default.resolve();
  },


  // Destroy the current connection pool for the client.
  destroy: function destroy(callback) {
    var _this5 = this;

    var maybeDestroy = this.pool && this.pool.destroy();

    return _bluebird2.default.resolve(maybeDestroy).then(function () {
      _this5.pool = void 0;

      if (typeof callback === 'function') {
        callback();
      }
    }).catch(function (err) {
      if (typeof callback === 'function') {
        callback(err);
      }

      return _bluebird2.default.reject(err);
    });
  },


  // Return the database being used by this client.
  database: function database() {
    return this.connectionSettings.database;
  },
  toString: function toString() {
    return '[object KnexClient]';
  },


  canCancelQuery: false,

  assertCanCancelQuery: function assertCanCancelQuery() {
    if (!this.canCancelQuery) {
      throw new Error("Query cancelling not supported for this dialect");
    }
  },
  cancelQuery: function cancelQuery() {
    throw new Error("Query cancelling not supported for this dialect");
  }
});

exports.default = Client;
module.exports = exports['default'];