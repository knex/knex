import Promise from 'bluebird';

import Raw from './raw';
import Ref from './ref';
import Runner from './runner';
import Formatter from './formatter';
import Transaction from './transaction';

import QueryBuilder from './query/builder';
import QueryCompiler from './query/compiler';

import SchemaBuilder from './schema/builder';
import SchemaCompiler from './schema/compiler';
import TableBuilder from './schema/tablebuilder';
import TableCompiler from './schema/tablecompiler';
import ColumnBuilder from './schema/columnbuilder';
import ColumnCompiler from './schema/columncompiler';

import { Pool, TimeoutError } from 'tarn';
import inherits from 'inherits';
import { EventEmitter } from 'events';

import { makeEscape } from './query/string';
import { assign, uniqueId, cloneDeep, defaults } from 'lodash';

import Logger from './logger';

const debug = require('debug')('knex:client');
const debugQuery = require('debug')('knex:query');
const debugBindings = require('debug')('knex:bindings');

// The base client provides the general structure
// for a dialect specific client object.
function Client(config = {}) {
  this.config = config;
  this.logger = new Logger(config);

  //Client is a required field, so throw error if it's not supplied.
  //If 'this.dialect' is set, then this is a 'super()' call, in which case
  //'client' does not have to be set as it's already assigned on the client prototype.
  if (!this.config.client && !this.dialect) {
    throw new Error(`knex: Required configuration option 'client' is missing.`);
  }

  if (config.version) {
    this.version = config.version;
  }

  this.connectionSettings = cloneDeep(config.connection || {});
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
inherits(Client, EventEmitter);

assign(Client.prototype, {
  formatter(builder) {
    return new Formatter(this, builder);
  },

  queryBuilder() {
    return new QueryBuilder(this);
  },

  queryCompiler(builder) {
    return new QueryCompiler(this, builder);
  },

  schemaBuilder() {
    return new SchemaBuilder(this);
  },

  schemaCompiler(builder) {
    return new SchemaCompiler(this, builder);
  },

  tableBuilder(type, tableName, fn) {
    return new TableBuilder(this, type, tableName, fn);
  },

  tableCompiler(tableBuilder) {
    return new TableCompiler(this, tableBuilder);
  },

  columnBuilder(tableBuilder, type, args) {
    return new ColumnBuilder(this, tableBuilder, type, args);
  },

  columnCompiler(tableBuilder, columnBuilder) {
    return new ColumnCompiler(this, tableBuilder, columnBuilder);
  },

  runner(builder) {
    return new Runner(this, builder);
  },

  transaction(container, config, outerTx) {
    return new Transaction(this, container, config, outerTx);
  },

  raw() {
    return new Raw(this).set(...arguments);
  },

  ref() {
    return new Ref(this, ...arguments);
  },

  _formatQuery(sql, bindings, timeZone) {
    bindings = bindings == null ? [] : [].concat(bindings);
    let index = 0;
    return sql.replace(/\\?\?/g, (match) => {
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

  _escapeBinding: makeEscape({
    escapeString(str) {
      return `'${str.replace(/'/g, "''")}'`;
    },
  }),

  query(connection, obj) {
    if (typeof obj === 'string') obj = { sql: obj };
    obj.bindings = this.prepBindings(obj.bindings);

    const { __knexUid, __knexTxId } = connection;

    this.emit('query', assign({ __knexUid, __knexTxId }, obj));
    debugQuery(obj.sql, __knexTxId);
    debugBindings(obj.bindings, __knexTxId);

    obj.sql = this.positionBindings(obj.sql);

    return this._query(connection, obj).catch((err) => {
      err.message =
        this._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message;
      this.emit('query-error', err, assign({ __knexUid, __knexTxId }, obj));
      throw err;
    });
  },

  stream(connection, obj, stream, options) {
    if (typeof obj === 'string') obj = { sql: obj };
    obj.bindings = this.prepBindings(obj.bindings);

    const { __knexUid, __knexTxId } = connection;

    this.emit('query', assign({ __knexUid, __knexTxId }, obj));
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
    return this.customWrapIdentifier(
      value,
      this.wrapIdentifierImpl,
      queryContext
    );
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
      this.logger.error(
        `Knex: run\n$ npm install ${this.driverName} --save\n${e.stack}`
      );
      process.exit(1);
    }
  },

  poolDefaults() {
    return { min: 2, max: 10, propagateCreateError: true };
  },

  getPoolSettings(poolConfig) {
    poolConfig = defaults({}, poolConfig, this.poolDefaults());

    [
      'maxWaitingClients',
      'testOnBorrow',
      'fifo',
      'priorityRange',
      'autostart',
      'evictionRunIntervalMillis',
      'numTestsPerRun',
      'softIdleTimeoutMillis',
      'Promise',
    ].forEach((option) => {
      if (option in poolConfig) {
        this.logger.warn(
          [
            `Pool config option "${option}" is no longer supported.`,
            `See https://github.com/Vincit/tarn.js for possible pool config options.`,
          ].join(' ')
        );
      }
    });

    const timeouts = [
      this.config.acquireConnectionTimeout || 60000,
      poolConfig.acquireTimeoutMillis,
    ].filter((timeout) => timeout !== undefined);

    // acquire connection timeout can be set on config or config.pool
    // choose the smallest, positive timeout setting and set on poolConfig
    poolConfig.acquireTimeoutMillis = Math.min(...timeouts);

    return Object.assign(poolConfig, {
      create: () => {
        return this.acquireRawConnection().tap((connection) => {
          connection.__knexUid = uniqueId('__knexUid');

          if (poolConfig.afterCreate) {
            return Promise.promisify(poolConfig.afterCreate)(connection);
          }
        });
      },

      destroy: (connection) => {
        if (poolConfig.beforeDestroy) {
          this.logger.warn(`
            beforeDestroy is deprecated, please open an issue if you use this
            to discuss alternative apis
          `);

          poolConfig.beforeDestroy(connection, function() {});
        }

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
  },

  initializePool(config = this.config) {
    if (this.pool) {
      this.logger.warn('The pool has already been initialized');
      return;
    }

    this.pool = new Pool(this.getPoolSettings(config.pool));
  },

  validateConnection(connection) {
    return true;
  },

  // Acquire a connection from the pool.
  acquireConnection() {
    if (!this.pool) {
      return Promise.reject(new Error('Unable to acquire a connection'));
    }

    return Promise.try(() => this.pool.acquire().promise)
      .tap((connection) => {
        debug('acquired connection from pool: %s', connection.__knexUid);
      })
      .catch(TimeoutError, () => {
        throw new Promise.TimeoutError(
          'Knex: Timeout acquiring a connection. The pool is probably full. ' +
            'Are you missing a .transacting(trx) call?'
        );
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

    return Promise.resolve();
  },

  // Destroy the current connection pool for the client.
  destroy(callback) {
    const maybeDestroy = this.pool && this.pool.destroy();

    return Promise.resolve(maybeDestroy)
      .then(() => {
        this.pool = void 0;

        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch((err) => {
        if (typeof callback === 'function') {
          callback(err);
        }

        return Promise.reject(err);
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
      throw new Error('Query cancelling not supported for this dialect');
    }
  },

  cancelQuery() {
    throw new Error('Query cancelling not supported for this dialect');
  },
});

export default Client;
