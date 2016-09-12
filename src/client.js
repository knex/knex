
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

import Pool2 from 'pool2';
import inherits from 'inherits';
import { EventEmitter } from 'events';

import { makeEscape } from './query/string'
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

  runner(connection) {
    return new Runner(this, connection)
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
    obj.bindings = this.prepBindings(obj.bindings)
    debugQuery(obj.sql)
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    return this._query(connection, obj).catch((err) => {
      err.message = this._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message
      this.emit('query-error', err, assign({__knexUid: connection.__knexUid}, obj))
      throw err
    })
  },

  stream(connection, obj, stream, options) {
    if (typeof obj === 'string') obj = {sql: obj}
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    debugQuery(obj.sql)
    obj.bindings = this.prepBindings(obj.bindings)
    return this._stream(connection, obj, stream, options)
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

  initializePool(config) {
    if (this.pool) this.destroy()
    this.pool = new Pool2(assign(this.poolDefaults(config.pool || {}), config.pool))
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
