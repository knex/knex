import Promise from 'bluebird';
import * as helpers from './helpers';

import Raw from './raw';
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

import * as genericPool from 'generic-pool';
import * as genericPoolErrors from 'generic-pool/lib/errors'
import inherits from 'inherits';
import { EventEmitter } from 'events';

import { makeEscape } from './query/string'
import { assign, uniqueId, cloneDeep, defaults, get } from 'lodash'

const debug = require('debug')('knex:client')
const debugQuery = require('debug')('knex:query')
const debugBindings = require('debug')('knex:bindings')

let id = 0
function clientId() {
  return `client${id++}`
}

// The base client provides the general structure
// for a dialect specific client object.
function Client(config = {}) {
  this.config = config

  //Client is a required field, so throw error if it's not supplied.
  //If 'this.dialect' is set, then this is a 'super()' call, in which case
  //'client' does not have to be set as it's already assigned on the client prototype.
  if(!this.config.client && !this.dialect) {
    throw new Error(`knex: Required configuration option 'client' is missing.`)
  }

  this.connectionSettings = cloneDeep(config.connection || {})
  if (this.driverName && config.connection) {
    this.initializeDriver()
    if (!config.pool || (config.pool && config.pool.max !== 0)) {
      this.__cid = clientId()
      this.initializePool(config)
    }
  }
  this.valueForUndefined = this.raw('DEFAULT');
  if (config.useNullAsDefault) {
    this.valueForUndefined = null
  }
}
inherits(Client, EventEmitter)

assign(Client.prototype, {

  formatter() {
    return new Formatter(this)
  },

  queryBuilder() {
    return new QueryBuilder(this)
  },

  queryCompiler(builder) {
    return new QueryCompiler(this, builder)
  },

  schemaBuilder() {
    return new SchemaBuilder(this)
  },

  schemaCompiler(builder) {
    return new SchemaCompiler(this, builder)
  },

  tableBuilder(type, tableName, fn) {
    return new TableBuilder(this, type, tableName, fn)
  },

  tableCompiler(tableBuilder) {
    return new TableCompiler(this, tableBuilder)
  },

  columnBuilder(tableBuilder, type, args) {
    return new ColumnBuilder(this, tableBuilder, type, args)
  },

  columnCompiler(tableBuilder, columnBuilder) {
    return new ColumnCompiler(this, tableBuilder, columnBuilder)
  },

  runner(builder) {
    return new Runner(this, builder)
  },

  transaction(container, config, outerTx) {
    return new Transaction(this, container, config, outerTx)
  },

  raw() {
    return new Raw(this).set(...arguments)
  },

  _formatQuery(sql, bindings, timeZone) {
    bindings = bindings == null ? [] : [].concat(bindings);
    let index = 0;
    return sql.replace(/\\?\?/g, (match) => {
      if (match === '\\?') {
        return '?'
      }
      if (index === bindings.length) {
        return match
      }
      const value = bindings[index++];
      return this._escapeBinding(value, {timeZone})
    })
  },

  _escapeBinding: makeEscape({
    escapeString(str) {
      return `'${str.replace(/'/g, "''")}'`
    }
  }),

  query(connection, obj) {
    if (typeof obj === 'string') obj = {sql: obj}
    obj.sql = this.positionBindings(obj.sql);
    obj.bindings = this.prepBindings(obj.bindings)
    debugQuery(obj.sql)
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    debugBindings(obj.bindings)
    return this._query(connection, obj).catch((err) => {
      err.message = this._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message
      this.emit('query-error', err, assign({__knexUid: connection.__knexUid}, obj))
      throw err
    })
  },

  stream(connection, obj, stream, options) {
    if (typeof obj === 'string') obj = {sql: obj}
    obj.sql = this.positionBindings(obj.sql);
    obj.bindings = this.prepBindings(obj.bindings)
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    debugQuery(obj.sql)
    debugBindings(obj.bindings)
    return this._stream(connection, obj, stream, options)
  },

  prepBindings(bindings) {
    return bindings;
  },

  positionBindings(sql) {
    return sql;
  },

  postProcessResponse(resp) {
    if (this.config.postProcessResponse) {
      return this.config.postProcessResponse(resp);
    }
    return resp;
  },

  wrapIdentifier(value) {
    if (this.config.wrapIdentifier) {
      return this.config.wrapIdentifier(value, this.wrapIdentifierImpl);
    }
    return this.wrapIdentifierImpl(value);
  },

  wrapIdentifierImpl(value) {
    return (value !== '*' ? `"${value.replace(/"/g, '""')}"` : '*')
  },

  initializeDriver() {
    try {
      this.driver = this._driver()
    } catch (e) {
      helpers.exit(`Knex: run\n$ npm install ${this.driverName} --save\n${e.stack}`)
    }
  },

  poolDefaults() {
    return {min: 2, max: 10, testOnBorrow: true, Promise}
  },

  getPoolSettings(poolConfig) {
    poolConfig = defaults({}, poolConfig, this.poolDefaults());
    const timeoutValidator = (config, path) => {
      let timeout = get(config, path)
      if (timeout !== undefined) {
        timeout = parseInt(timeout, 10)
        if (isNaN(timeout) || timeout <= 0) {
          throw new Error(`${path} must be a positive int`)
        }
      }
      return timeout
    }

    // acquire connection timeout can be set on config or config.pool
    // choose the smallest, positive timeout setting and set on poolConfig
    const timeouts = [
      timeoutValidator(this.config, 'acquireConnectionTimeout') || 60000,
      timeoutValidator({pool: poolConfig}, 'pool.acquireTimeoutMillis')
    ].filter(timeout => timeout !== undefined)
    poolConfig.acquireTimeoutMillis = Math.min(...timeouts);

    return {
      config: poolConfig,
      factory: {
        create: () => {
          return this.acquireRawConnection()
            .tap(function(connection) {
              connection.__knexUid = uniqueId('__knexUid')
              if (poolConfig.afterCreate) {
                return Promise.promisify(poolConfig.afterCreate)(connection)
              }
            })
            .catch(err => {
              // Acquire connection must never reject, because generic-pool
              // will retry trying to get connection until acquireConnectionTimeout is
              // reached. acquireConnectionTimeout should trigger in knex only 
              // in that case if aquiring connection waits because pool is full
              // https://github.com/coopernurse/node-pool/pull/184
              // https://github.com/tgriesser/knex/issues/2325
              return {
                genericPoolMissingRetryCountHack: true,
                __knex__disposed: err,
                query: () => {
                  throw err; // pass error to query
                }
              };
            });
        },
        destroy: (connection) => {
          if (connection.genericPoolMissingRetryCountHack) {
            return;
          }
          if (poolConfig.beforeDestroy) {
            helpers.warn(`
              beforeDestroy is deprecated, please open an issue if you use this
              to discuss alternative apis
            `)
            poolConfig.beforeDestroy(connection, function() {})
          }
          if (connection !== void 0) {
            return this.destroyRawConnection(connection)
          }

          return Promise.resolve();
        },
        validate: (connection) => {
          if (connection.__knex__disposed) {
            helpers.warn(`Connection Error: ${connection.__knex__disposed}`)
            return Promise.resolve(false);
          }
          return this.validateConnection(connection)
        }
      },
    }
  },

  initializePool(config) {
    if (this.pool) {
      helpers.warn('The pool has already been initialized')
      return
    }

    const poolSettings = this.getPoolSettings(config.pool);

    this.pool = genericPool.createPool(poolSettings.factory, poolSettings.config)
  },

  validateConnection(connection) {
    return Promise.resolve(true);
  },

  // Acquire a connection from the pool.
  acquireConnection() {
    if (!this.pool) {
      return Promise.reject(new Error('Unable to acquire a connection'))
    }
    return this.pool.acquire()
      .tap(connection => {
        debug('acquired connection from pool: %s', connection.__knexUid)
      })
      .catch(genericPoolErrors.TimeoutError, () => {
        throw new Promise.TimeoutError(
          'Knex: Timeout acquiring a connection. The pool is probably full. ' +
          'Are you missing a .transacting(trx) call?'
        )
      });
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(connection) {
    debug('releasing connection to pool: %s', connection.__knexUid)
    return this.pool.release(connection).catch(() => {
      debug('pool refused connection: %s', connection.__knexUid)
    })
  },

  // Destroy the current connection pool for the client.
  destroy(callback) {
    return Promise.resolve(
      this.pool &&
      this.pool.drain()
        .then(() => this.pool.clear())
        .then(() => {
          this.pool = void 0
          if(typeof callback === 'function') {
            callback();
          }
        })
    );
  },

  // Return the database being used by this client.
  database() {
    return this.connectionSettings.database
  },

  toString() {
    return '[object KnexClient]'
  },

  canCancelQuery: false,

  assertCanCancelQuery() {
    if (!this.canCancelQuery) {
      throw new Error("Query cancelling not supported for this dialect");
    }
  },

  cancelQuery() {
    throw new Error("Query cancelling not supported for this dialect")
  }

})

export default Client
