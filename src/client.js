
import Promise from './promise';
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

import Pool2 from 'pool2';
import inherits from 'inherits';
import { EventEmitter } from 'events';
import SqlString from './query/string';

import { assign, uniqueId, cloneDeep } from 'lodash'

const debug = require('debug')('knex:client')
const debugQuery = require('debug')('knex:query')

// The base client provides the general structure
// for a dialect specific client object.
function Client(config = {}) {
  this.config = config
  this.connectionSettings = cloneDeep(config.connection || {})
  if (this.driverName && config.connection) {
    this.initializeDriver()
    if (!config.pool || (config.pool && config.pool.max !== 0)) {
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

  Formatter,

  formatter() {
    return new this.Formatter(this)
  },

  QueryBuilder,

  queryBuilder() {
    return new this.QueryBuilder(this)
  },

  QueryCompiler,

  queryCompiler(builder) {
    return new this.QueryCompiler(this, builder)
  },

  SchemaBuilder,

  schemaBuilder() {
    return new this.SchemaBuilder(this)
  },

  SchemaCompiler,

  schemaCompiler(builder) {
    return new this.SchemaCompiler(this, builder)
  },

  TableBuilder,

  tableBuilder(type, tableName, fn) {
    return new this.TableBuilder(this, type, tableName, fn)
  },

  TableCompiler,

  tableCompiler(tableBuilder) {
    return new this.TableCompiler(this, tableBuilder)
  },

  ColumnBuilder,

  columnBuilder(tableBuilder, type, args) {
    return new this.ColumnBuilder(this, tableBuilder, type, args)
  },

  ColumnCompiler,

  columnCompiler(tableBuilder, columnBuilder) {
    return new this.ColumnCompiler(this, tableBuilder, columnBuilder)
  },

  Runner,

  runner(connection) {
    return new this.Runner(this, connection)
  },

  SqlString,

  Transaction,

  transaction(container, config, outerTx) {
    return new this.Transaction(this, container, config, outerTx)
  },

  Raw,

  raw() {
    const raw = new this.Raw(this)
    return raw.set.apply(raw, arguments)
  },

  query(connection, obj) {
    if (typeof obj === 'string') obj = {sql: obj}
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    debugQuery(obj.sql)
    return this._query.call(this, connection, obj).catch((err) => {
      err.message = SqlString.format(obj.sql, obj.bindings) + ' - ' + err.message
      this.emit('query-error', err, assign({__knexUid: connection.__knexUid}, obj))
      throw err
    })
  },

  stream(connection, obj, stream, options) {
    if (typeof obj === 'string') obj = {sql: obj}
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    debugQuery(obj.sql)
    return this._stream.call(this, connection, obj, stream, options)
  },

  prepBindings(bindings) {
    return bindings;
  },

  wrapIdentifier(value) {
    return (value !== '*' ? `"${value.replace(/"/g, '""')}"` : '*')
  },

  initializeDriver() {
    try {
      this.driver = this._driver()
    } catch (e) {
      helpers.exit(`Knex: run\n$ npm install ${this.driverName} --save\n${e.stack}`)
    }
  },

  Pool: Pool2,

  initializePool(config) {
    if (this.pool) this.destroy()
    this.pool = new this.Pool(assign(this.poolDefaults(config.pool || {}), config.pool))
    this.pool.on('error', function(err) {
      helpers.error(`Pool2 - ${err}`)
    })
    this.pool.on('warn', function(msg) {
      helpers.warn(`Pool2 - ${msg}`)
    })
  },

  poolDefaults(poolConfig) {
    const client = this
    return {
      min: 2,
      max: 10,
      acquire(callback) {
        client.acquireRawConnection()
          .tap(function(connection) {
            connection.__knexUid = uniqueId('__knexUid')
            if (poolConfig.afterCreate) {
              return Promise.promisify(poolConfig.afterCreate)(connection)
            }
          })
          .asCallback(callback)
      },
      dispose(connection, callback) {
        if (poolConfig.beforeDestroy) {
          poolConfig.beforeDestroy(connection, function() {
            if (connection !== undefined) {
              client.destroyRawConnection(connection, callback)
            }
          })
        } else if (connection !== void 0) {
          client.destroyRawConnection(connection, callback)
        }
      },
      ping(resource, callback) {
        return client.ping(resource, callback);
      }
    }
  },

  // Acquire a connection from the pool.
  acquireConnection() {
    const client = this
    let request = null
    const completed = new Promise(function(resolver, rejecter) {
      if (!client.pool) {
        return rejecter(new Error('There is no pool defined on the current client'))
      }
      request = client.pool.acquire(function(err, connection) {
        if (err) return rejecter(err)
        debug('acquired connection from pool: %s', connection.__knexUid)
        resolver(connection)
      })
    })
    const abort = function(reason) {
      if (request && !request.fulfilled) {
        request.abort(reason)
      }
    }
    return {
      completed: completed,
      abort: abort
    }
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(connection) {
    const { pool } = this
    return new Promise(function(resolver) {
      debug('releasing connection to pool: %s', connection.__knexUid)
      pool.release(connection)
      resolver()
    })
  },

  // Destroy the current connection pool for the client.
  destroy(callback) {
    const client = this
    const promise = new Promise(function(resolver) {
      if (!client.pool) return resolver()
      client.pool.end(function() {
        client.pool = undefined
        resolver()
      })
    })
    // Allow either a callback or promise interface for destruction.
    if (typeof callback === 'function') {
      promise.asCallback(callback)
    } else {
      return promise
    }
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
