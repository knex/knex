const { Pool, TimeoutError } = require('tarn');
const { EventEmitter } = require('events');
const { promisify } = require('util');
const { makeEscape } = require('./util/string');
const cloneDeep = require('lodash/cloneDeep');
const defaults = require('lodash/defaults');
const uniqueId = require('lodash/uniqueId');

const Runner = require('./execution/runner');
const Transaction = require('./execution/transaction');
const {
  executeQuery,
  enrichQueryObject,
} = require('./execution/internal/query-executioner');
const QueryBuilder = require('./query/querybuilder');
const QueryCompiler = require('./query/querycompiler');
const SchemaBuilder = require('./schema/builder');
const SchemaCompiler = require('./schema/compiler');
const TableBuilder = require('./schema/tablebuilder');
const TableCompiler = require('./schema/tablecompiler');
const ColumnBuilder = require('./schema/columnbuilder');
const ColumnCompiler = require('./schema/columncompiler');
const { KnexTimeoutError } = require('./util/timeout');
const { outputQuery, unwrapRaw } = require('./formatter/wrappingFormatter');
const { compileCallback } = require('./formatter/formatterUtils');
const Raw = require('./raw');
const Ref = require('./ref');
const Formatter = require('./formatter');
const Logger = require('./logger');
const { POOL_CONFIG_OPTIONS } = require('./constants');
const ViewBuilder = require('./schema/viewbuilder.js');
const ViewCompiler = require('./schema/viewcompiler.js');
const isPlainObject = require('lodash/isPlainObject');

const debug = require('debug')('knex:client');

// The base client provides the general structure
// for a dialect specific client object.

class Client extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.logger = new Logger(config);

    //Client is a required field, so throw error if it's not supplied.
    //If 'this.dialect' is set, then this is a 'super()' call, in which case
    //'client' does not have to be set as it's already assigned on the client prototype.

    if (this.dialect && !this.config.client) {
      this.logger.warn(
        `Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the future. Please use configuration option 'client' instead.`
      );
    }

    const dbClient = this.config.client || this.dialect;
    if (!dbClient) {
      throw new Error(
        `knex: Required configuration option 'client' is missing.`
      );
    }

    if (config.version) {
      this.version = config.version;
    }

    if (config.connection && config.connection instanceof Function) {
      this.connectionConfigProvider = config.connection;
      this.connectionConfigExpirationChecker = () => true; // causes the provider to be called on first use
    } else {
      this.connectionSettings = cloneDeep(config.connection || {});
      this.connectionConfigExpirationChecker = null;
    }
    if (this.driverName && config.connection) {
      this.initializeDriver();
      if (!config.pool || (config.pool && config.pool.max !== 0)) {
        this.initializePool(config);
      }
    }
    this.valueForUndefined = this.raw('DEFAULT');
    if (config.useNullAsDefault) {
      this.valueForUndefined = null;
    }
  }
  formatter(builder) {
    return new Formatter(this, builder);
  }

  queryBuilder() {
    return new QueryBuilder(this);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaBuilder() {
    return new SchemaBuilder(this);
  }

  schemaCompiler(builder) {
    return new SchemaCompiler(this, builder);
  }

  tableBuilder(type, tableName, tableNameLike, fn) {
    return new TableBuilder(this, type, tableName, tableNameLike, fn);
  }

  viewBuilder(type, viewBuilder, fn) {
    return new ViewBuilder(this, type, viewBuilder, fn);
  }

  tableCompiler(tableBuilder) {
    return new TableCompiler(this, tableBuilder);
  }

  viewCompiler(viewCompiler) {
    return new ViewCompiler(this, viewCompiler);
  }

  columnBuilder(tableBuilder, type, args) {
    return new ColumnBuilder(this, tableBuilder, type, args);
  }

  columnCompiler(tableBuilder, columnBuilder) {
    return new ColumnCompiler(this, tableBuilder, columnBuilder);
  }

  runner(builder) {
    return new Runner(this, builder);
  }

  transaction(container, config, outerTx) {
    return new Transaction(this, container, config, outerTx);
  }

  raw() {
    return new Raw(this).set(...arguments);
  }

  ref() {
    return new Ref(this, ...arguments);
  }
  query(connection, queryParam) {
    const queryObject = enrichQueryObject(connection, queryParam, this);
    return executeQuery(connection, queryObject, this);
  }

  stream(connection, queryParam, stream, options) {
    const queryObject = enrichQueryObject(connection, queryParam, this);
    return this._stream(connection, queryObject, stream, options);
  }

  prepBindings(bindings) {
    return bindings;
  }

  positionBindings(sql) {
    return sql;
  }

  postProcessResponse(resp, queryContext) {
    if (this.config.postProcessResponse) {
      return this.config.postProcessResponse(resp, queryContext);
    }
    return resp;
  }

  wrapIdentifier(value, queryContext) {
    return this.customWrapIdentifier(
      value,
      this.wrapIdentifierImpl,
      queryContext
    );
  }

  customWrapIdentifier(value, origImpl, queryContext) {
    if (this.config.wrapIdentifier) {
      return this.config.wrapIdentifier(value, origImpl, queryContext);
    }
    return origImpl(value);
  }

  wrapIdentifierImpl(value) {
    return value !== '*' ? `"${value.replace(/"/g, '""')}"` : '*';
  }

  initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      const message = `Knex: run\n$ npm install ${this.driverName} --save`;
      this.logger.error(`${message}\n${e.message}\n${e.stack}`);
      throw new Error(`${message}\n${e.message}`);
    }
  }

  poolDefaults() {
    return { min: 2, max: 10, propagateCreateError: true };
  }

  getPoolSettings(poolConfig) {
    poolConfig = defaults({}, poolConfig, this.poolDefaults());

    POOL_CONFIG_OPTIONS.forEach((option) => {
      if (option in poolConfig) {
        this.logger.warn(
          [
            `Pool config option "${option}" is no longer supported.`,
            `See https://github.com/Vincit/tarn.js for possible pool config options.`,
          ].join(' ')
        );
      }
    });

    const DEFAULT_ACQUIRE_TIMEOUT = 60000;
    const timeouts = [
      this.config.acquireConnectionTimeout,
      poolConfig.acquireTimeoutMillis,
    ].filter((timeout) => timeout !== undefined);

    if (!timeouts.length) {
      timeouts.push(DEFAULT_ACQUIRE_TIMEOUT);
    }

    // acquire connection timeout can be set on config or config.pool
    // choose the smallest, positive timeout setting and set on poolConfig
    poolConfig.acquireTimeoutMillis = Math.min(...timeouts);

    const updatePoolConnectionSettingsFromProvider = async () => {
      if (!this.connectionConfigProvider) {
        return; // static configuration, nothing to update
      }
      if (
        !this.connectionConfigExpirationChecker ||
        !this.connectionConfigExpirationChecker()
      ) {
        return; // not expired, reuse existing connection
      }
      const providerResult = await this.connectionConfigProvider();
      if (providerResult.expirationChecker) {
        this.connectionConfigExpirationChecker =
          providerResult.expirationChecker;
        delete providerResult.expirationChecker; // MySQL2 driver warns on receiving extra properties
      } else {
        this.connectionConfigExpirationChecker = null;
      }
      this.connectionSettings = providerResult;
    };

    return Object.assign(poolConfig, {
      create: async () => {
        await updatePoolConnectionSettingsFromProvider();
        const connection = await this.acquireRawConnection();
        connection.__knexUid = uniqueId('__knexUid');
        if (poolConfig.afterCreate) {
          await promisify(poolConfig.afterCreate)(connection);
        }
        return connection;
      },

      destroy: (connection) => {
        if (connection !== void 0) {
          return this.destroyRawConnection(connection);
        }
      },

      validate: (connection) => {
        if (connection.__knex__disposed) {
          this.logger.warn(`Connection Error: ${connection.__knex__disposed}`);
          return false;
        }

        return this.validateConnection(connection);
      },
    });
  }

  initializePool(config = this.config) {
    if (this.pool) {
      this.logger.warn('The pool has already been initialized');
      return;
    }

    const tarnPoolConfig = {
      ...this.getPoolSettings(config.pool),
    };
    // afterCreate is an internal knex param, tarn.js does not support it
    if (tarnPoolConfig.afterCreate) {
      delete tarnPoolConfig.afterCreate;
    }

    this.pool = new Pool(tarnPoolConfig);
  }

  validateConnection(connection) {
    return true;
  }

  // Acquire a connection from the pool.
  async acquireConnection() {
    if (!this.pool) {
      throw new Error('Unable to acquire a connection');
    }
    try {
      const connection = await this.pool.acquire().promise;
      debug('acquired connection from pool: %s', connection.__knexUid);
      return connection;
    } catch (error) {
      let convertedError = error;
      if (error instanceof TimeoutError) {
        convertedError = new KnexTimeoutError(
          'Knex: Timeout acquiring a connection. The pool is probably full. ' +
            'Are you missing a .transacting(trx) call?'
        );
      }
      throw convertedError;
    }
  }

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(connection) {
    debug('releasing connection to pool: %s', connection.__knexUid);
    const didRelease = this.pool.release(connection);

    if (!didRelease) {
      debug('pool refused connection: %s', connection.__knexUid);
    }

    return Promise.resolve();
  }

  // Destroy the current connection pool for the client.
  async destroy(callback) {
    try {
      if (this.pool && this.pool.destroy) {
        await this.pool.destroy();
      }
      this.pool = undefined;

      if (typeof callback === 'function') {
        callback();
      }
    } catch (err) {
      if (typeof callback === 'function') {
        return callback(err);
      }
      throw err;
    }
  }

  // Return the database being used by this client.
  database() {
    return this.connectionSettings.database;
  }

  toString() {
    return '[object KnexClient]';
  }

  assertCanCancelQuery() {
    if (!this.canCancelQuery) {
      throw new Error('Query cancelling not supported for this dialect');
    }
  }

  cancelQuery() {
    throw new Error('Query cancelling not supported for this dialect');
  }

  // Formatter part

  alias(first, second) {
    return first + ' as ' + second;
  }

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value, builder, bindingsHolder) {
    if (typeof value === 'function') {
      return outputQuery(
        compileCallback(value, undefined, this, bindingsHolder),
        true,
        builder,
        this
      );
    }
    return unwrapRaw(value, true, builder, this, bindingsHolder) || '?';
  }

  // Turns a list of values into a list of ?'s, joining them with commas unless
  // a "joining" value is specified (e.g. ' and ')
  parameterize(values, notSetValue, builder, bindingsHolder) {
    if (typeof values === 'function')
      return this.parameter(values, builder, bindingsHolder);
    values = Array.isArray(values) ? values : [values];
    let str = '',
      i = -1;
    while (++i < values.length) {
      if (i > 0) str += ', ';
      let value = values[i];
      // json columns can have object in values.
      if (isPlainObject(value)) {
        value = JSON.stringify(value);
      }
      str += this.parameter(
        value === undefined ? notSetValue : value,
        builder,
        bindingsHolder
      );
    }
    return str;
  }

  // Formats `values` into a parenthesized list of parameters for a `VALUES`
  // clause.
  //
  // [1, 2]                  -> '(?, ?)'
  // [[1, 2], [3, 4]]        -> '((?, ?), (?, ?))'
  // knex('table')           -> '(select * from "table")'
  // knex.raw('select ?', 1) -> '(select ?)'
  //
  values(values, builder, bindingsHolder) {
    if (Array.isArray(values)) {
      if (Array.isArray(values[0])) {
        return `(${values
          .map(
            (value) =>
              `(${this.parameterize(
                value,
                undefined,
                builder,
                bindingsHolder
              )})`
          )
          .join(', ')})`;
      }
      return `(${this.parameterize(
        values,
        undefined,
        builder,
        bindingsHolder
      )})`;
    }

    if (values && values.isRawInstance) {
      return `(${this.parameter(values, builder, bindingsHolder)})`;
    }

    return this.parameter(values, builder, bindingsHolder);
  }

  processPassedConnection(connection) {
    // Default implementation is noop
  }

  toPathForJson(jsonPath) {
    // By default, we want a json path, so if this function is not overriden,
    // we return the path.
    return jsonPath;
  }
}

Object.assign(Client.prototype, {
  _escapeBinding: makeEscape({
    escapeString(str) {
      return `'${str.replace(/'/g, "''")}'`;
    },
  }),

  canCancelQuery: false,
});

module.exports = Client;
