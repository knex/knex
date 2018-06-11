'use strict';

exports.__esModule = true;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _ref = require('./ref');

var _ref2 = _interopRequireDefault(_ref);

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

const debug = require('debug')('knex:client');
const debugQuery = require('debug')('knex:query');
const debugBindings = require('debug')('knex:bindings');

// The base client provides the general structure
// for a dialect specific client object.
function Client(config = {}) {
  this.config = config;
  this.logger = new _logger2.default(config);

  //Client is a required field, so throw error if it's not supplied.
  //If 'this.dialect' is set, then this is a 'super()' call, in which case
  //'client' does not have to be set as it's already assigned on the client prototype.
  if (!this.config.client && !this.dialect) {
    throw new Error(`knex: Required configuration option 'client' is missing.`);
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

  formatter(builder) {
    return new _formatter2.default(this, builder);
  },

  queryBuilder() {
    return new _builder2.default(this);
  },

  queryCompiler(builder) {
    return new _compiler2.default(this, builder);
  },

  schemaBuilder() {
    return new _builder4.default(this);
  },

  schemaCompiler(builder) {
    return new _compiler4.default(this, builder);
  },

  tableBuilder(type, tableName, fn) {
    return new _tablebuilder2.default(this, type, tableName, fn);
  },

  tableCompiler(tableBuilder) {
    return new _tablecompiler2.default(this, tableBuilder);
  },

  columnBuilder(tableBuilder, type, args) {
    return new _columnbuilder2.default(this, tableBuilder, type, args);
  },

  columnCompiler(tableBuilder, columnBuilder) {
    return new _columncompiler2.default(this, tableBuilder, columnBuilder);
  },

  runner(builder) {
    return new _runner2.default(this, builder);
  },

  transaction(container, config, outerTx) {
    return new _transaction2.default(this, container, config, outerTx);
  },

  raw() {
    return new _raw2.default(this).set(...arguments);
  },

  ref() {
    return new _ref2.default(this, ...arguments);
  },

  _formatQuery(sql, bindings, timeZone) {
    bindings = bindings == null ? [] : [].concat(bindings);
    let index = 0;
    return sql.replace(/\\?\?/g, match => {
      if (match === '\\?') {
        return '?';
      }
      if (index === bindings.length) {
        return match;
      }
      const value = bindings[index++];
      return this._escapeBinding(value, { timeZone });
    });
  },

  _escapeBinding: (0, _string.makeEscape)({
    escapeString(str) {
      return `'${str.replace(/'/g, "''")}'`;
    }
  }),

  query(connection, obj) {
    if (typeof obj === 'string') obj = { sql: obj };
    obj.bindings = this.prepBindings(obj.bindings);

    const { __knexUid, __knexTxId } = connection;

    this.emit('query', (0, _lodash.assign)({ __knexUid, __knexTxId }, obj));
    debugQuery(obj.sql, __knexTxId);
    debugBindings(obj.bindings, __knexTxId);

    obj.sql = this.positionBindings(obj.sql);

    return this._query(connection, obj).catch(err => {
      err.message = this._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message;
      this.emit('query-error', err, (0, _lodash.assign)({ __knexUid, __knexTxId }, obj));
      throw err;
    });
  },

  stream(connection, obj, stream, options) {
    if (typeof obj === 'string') obj = { sql: obj };
    obj.bindings = this.prepBindings(obj.bindings);

    const { __knexUid, __knexTxId } = connection;

    this.emit('query', (0, _lodash.assign)({ __knexUid, __knexTxId }, obj));
    debugQuery(obj.sql, __knexTxId);
    debugBindings(obj.bindings, __knexTxId);

    obj.sql = this.positionBindings(obj.sql);

    return this._stream(connection, obj, stream, options);
  },

  prepBindings(bindings) {
    return bindings;
  },

  positionBindings(sql) {
    return sql;
  },

  postProcessResponse(resp, queryContext) {
    if (this.config.postProcessResponse) {
      return this.config.postProcessResponse(resp, queryContext);
    }
    return resp;
  },

  wrapIdentifier(value, queryContext) {
    return this.customWrapIdentifier(value, this.wrapIdentifierImpl, queryContext);
  },

  customWrapIdentifier(value, origImpl, queryContext) {
    if (this.config.wrapIdentifier) {
      return this.config.wrapIdentifier(value, origImpl, queryContext);
    }
    return origImpl(value);
  },

  wrapIdentifierImpl(value) {
    return value !== '*' ? `"${value.replace(/"/g, '""')}"` : '*';
  },

  initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      this.logger.error(`Knex: run\n$ npm install ${this.driverName} --save\n${e.stack}`);
      process.exit(1);
    }
  },

  poolDefaults() {
    return { min: 2, max: 10, propagateCreateError: true };
  },

  getPoolSettings(poolConfig) {
    poolConfig = (0, _lodash.defaults)({}, poolConfig, this.poolDefaults());

    ['maxWaitingClients', 'testOnBorrow', 'fifo', 'priorityRange', 'autostart', 'evictionRunIntervalMillis', 'numTestsPerRun', 'softIdleTimeoutMillis', 'Promise'].forEach(option => {
      if (option in poolConfig) {
        this.logger.warn([`Pool config option "${option}" is no longer supported.`, `See https://github.com/Vincit/tarn.js for possible pool config options.`].join(' '));
      }
    });

    const timeouts = [this.config.acquireConnectionTimeout || 60000, poolConfig.acquireTimeoutMillis].filter(timeout => timeout !== undefined);

    // acquire connection timeout can be set on config or config.pool
    // choose the smallest, positive timeout setting and set on poolConfig
    poolConfig.acquireTimeoutMillis = Math.min(...timeouts);

    return (0, _assign2.default)(poolConfig, {
      create: () => {
        return this.acquireRawConnection().tap(connection => {
          connection.__knexUid = (0, _lodash.uniqueId)('__knexUid');

          if (poolConfig.afterCreate) {
            return _bluebird2.default.promisify(poolConfig.afterCreate)(connection);
          }
        });
      },

      destroy: connection => {
        if (poolConfig.beforeDestroy) {
          this.logger.warn(`
            beforeDestroy is deprecated, please open an issue if you use this
            to discuss alternative apis
          `);

          poolConfig.beforeDestroy(connection, function () {});
        }

        if (connection !== void 0) {
          return this.destroyRawConnection(connection);
        }
      },

      validate: connection => {
        if (connection.__knex__disposed) {
          this.logger.warn(`Connection Error: ${connection.__knex__disposed}`);
          return false;
        }

        return this.validateConnection(connection);
      }
    });
  },

  initializePool(config) {
    if (this.pool) {
      this.logger.warn('The pool has already been initialized');
      return;
    }

    this.pool = new _tarn.Pool(this.getPoolSettings(config.pool));
  },

  validateConnection(connection) {
    return true;
  },

  // Acquire a connection from the pool.
  acquireConnection() {
    if (!this.pool) {
      return _bluebird2.default.reject(new Error('Unable to acquire a connection'));
    }

    return _bluebird2.default.try(() => this.pool.acquire().promise).tap(connection => {
      debug('acquired connection from pool: %s', connection.__knexUid);
    }).catch(_tarn.TimeoutError, () => {
      throw new _bluebird2.default.TimeoutError('Knex: Timeout acquiring a connection. The pool is probably full. ' + 'Are you missing a .transacting(trx) call?');
    });
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(connection) {
    debug('releasing connection to pool: %s', connection.__knexUid);
    const didRelease = this.pool.release(connection);

    if (!didRelease) {
      debug('pool refused connection: %s', connection.__knexUid);
    }

    return _bluebird2.default.resolve();
  },

  // Destroy the current connection pool for the client.
  destroy(callback) {

    const maybeDestroy = this.pool && this.pool.destroy();

    return _bluebird2.default.resolve(maybeDestroy).then(() => {
      this.pool = void 0;

      if (typeof callback === 'function') {
        callback();
      }
    }).catch(err => {
      if (typeof callback === 'function') {
        callback(err);
      }

      return _bluebird2.default.reject(err);
    });
  },

  // Return the database being used by this client.
  database() {
    return this.connectionSettings.database;
  },

  toString() {
    return '[object KnexClient]';
  },

  canCancelQuery: false,

  assertCanCancelQuery() {
    if (!this.canCancelQuery) {
      throw new Error("Query cancelling not supported for this dialect");
    }
  },

  cancelQuery() {
    throw new Error("Query cancelling not supported for this dialect");
  }

});

exports.default = Client;
module.exports = exports['default'];