'use strict';

exports.__esModule = true;

var _cloneDeep2 = require('lodash/cloneDeep');

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _uniqueId2 = require('lodash/uniqueId');

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

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

var _genericPool = require('generic-pool');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

var _string = require('./query/string');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:client');
var debugQuery = require('debug')('knex:query');
var debugBindings = require('debug')('knex:bindings');
var debugPool = require('debug')('knex:pool');

var id = 0;
function clientId() {
  return 'client' + id++;
}

// The base client provides the general structure
// for a dialect specific client object.
function Client() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.config = config;

  //Client is a required field, so throw error if it's not supplied.
  //If 'this.dialect' is set, then this is a 'super()' call, in which case
  //'client' does not have to be set as it's already assigned on the client prototype.
  if (!this.config.client && !this.dialect) {
    throw new Error('knex: Required configuration option \'client\' is missing.');
  }

  this.connectionSettings = (0, _cloneDeep3.default)(config.connection || {});
  if (this.driverName && config.connection) {
    this.initializeDriver();
    if (!config.pool || config.pool && config.pool.max !== 0) {
      this.__cid = clientId();
      this.initializePool(config);
    }
  }
  this.valueForUndefined = this.raw('DEFAULT');
  if (config.useNullAsDefault) {
    this.valueForUndefined = null;
  }
}
(0, _inherits2.default)(Client, _events.EventEmitter);

(0, _assign3.default)(Client.prototype, {
  formatter: function formatter() {
    return new _formatter2.default(this);
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
  runner: function runner(connection) {
    return new _runner2.default(this, connection);
  },
  transaction: function transaction(container, config, outerTx) {
    return new _transaction2.default(this, container, config, outerTx);
  },
  raw: function raw() {
    var _ref;

    return (_ref = new _raw2.default(this)).set.apply(_ref, arguments);
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
    debugQuery(obj.sql);
    this.emit('query', (0, _assign3.default)({ __knexUid: connection.__knexUid }, obj));
    debugBindings(obj.bindings);
    return this._query(connection, obj).catch(function (err) {
      err.message = _this2._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message;
      _this2.emit('query-error', err, (0, _assign3.default)({ __knexUid: connection.__knexUid }, obj));
      throw err;
    });
  },
  stream: function stream(connection, obj, _stream, options) {
    if (typeof obj === 'string') obj = { sql: obj };
    this.emit('query', (0, _assign3.default)({ __knexUid: connection.__knexUid }, obj));
    debugQuery(obj.sql);
    obj.bindings = this.prepBindings(obj.bindings);
    debugBindings(obj.bindings);
    return this._stream(connection, obj, _stream, options);
  },
  prepBindings: function prepBindings(bindings) {
    return bindings;
  },
  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*';
  },
  initializeDriver: function initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      helpers.exit('Knex: run\n$ npm install ' + this.driverName + ' --save\n' + e.stack);
    }
  },
  poolDefaults: function poolDefaults(poolConfig) {
    var _this3 = this;

    var name = this.dialect + ':' + this.driverName + ':' + this.__cid;
    return {
      min: 2,
      max: 10,
      name: name,
      log: function log(str, level) {
        if (level === 'info') {
          debugPool(level.toUpperCase() + ' pool ' + name + ' - ' + str);
        }
      },

      create: function create(callback) {
        _this3.acquireRawConnection().tap(function (connection) {
          connection.__knexUid = (0, _uniqueId3.default)('__knexUid');
          if (poolConfig.afterCreate) {
            return _bluebird2.default.promisify(poolConfig.afterCreate)(connection);
          }
        }).asCallback(callback);
      },
      destroy: function destroy(connection) {
        if (poolConfig.beforeDestroy) {
          helpers.warn('\n            beforeDestroy is deprecated, please open an issue if you use this\n            to discuss alternative apis\n          ');
          poolConfig.beforeDestroy(connection, function () {});
        }
        if (connection !== void 0) {
          _this3.destroyRawConnection(connection);
        }
      },
      validate: function validate(connection) {
        if (connection.__knex__disposed) {
          helpers.warn('Connection Error: ' + connection.__knex__disposed);
          return false;
        }
        return _this3.validateConnection(connection);
      }
    };
  },
  initializePool: function initializePool(config) {
    if (this.pool) {
      helpers.warn('The pool has already been initialized');
      return;
    }
    this.pool = new _genericPool.Pool((0, _assign3.default)(this.poolDefaults(config.pool || {}), config.pool));
  },
  validateConnection: function validateConnection(connection) {
    return true;
  },


  // Acquire a connection from the pool.
  acquireConnection: function acquireConnection() {
    var _this4 = this;

    return new _bluebird2.default(function (resolver, rejecter) {
      if (!_this4.pool) {
        return rejecter(new Error('Unable to acquire a connection'));
      }
      var wasRejected = false;
      var t = setTimeout(function () {
        wasRejected = true;
        rejecter(new _bluebird2.default.TimeoutError('Knex: Timeout acquiring a connection. The pool is probably full. ' + 'Are you missing a .transacting(trx) call?'));
      }, _this4.config.acquireConnectionTimeout || 60000);
      _this4.pool.acquire(function (err, connection) {
        if (err) {
          return rejecter(err);
        }
        clearTimeout(t);
        if (wasRejected) {
          _this4.pool.release(connection);
        } else {
          debug('acquired connection from pool: %s', connection.__knexUid);
          resolver(connection);
        }
      });
    });
  },


  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection: function releaseConnection(connection) {
    var _this5 = this;

    return new _bluebird2.default(function (resolver) {
      debug('releasing connection to pool: %s', connection.__knexUid);
      _this5.pool.release(connection);
      resolver();
    });
  },


  // Destroy the current connection pool for the client.
  destroy: function destroy(callback) {
    var _this6 = this;

    var promise = new _bluebird2.default(function (resolver) {
      if (!_this6.pool) {
        return resolver();
      }
      _this6.pool.drain(function () {
        _this6.pool.destroyAllNow(function () {
          _this6.pool = undefined;
          resolver();
        });
      });
    });

    // Allow either a callback or promise interface for destruction.
    if (typeof callback === 'function') {
      promise.asCallback(callback);
    } else {
      return promise;
    }
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