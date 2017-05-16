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

import { Pool } from 'generic-pool';
import inherits from 'inherits';
import { EventEmitter } from 'events';

import { makeEscape } from './query/string'
import { assign, uniqueId, cloneDeep } from 'lodash'

const debug = require('debug')('knex:client')
const debugQuery = require('debug')('knex:query')
const debugBindings = require('debug')('knex:bindings')
const debugPool = require('debug')('knex:pool')

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
    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
    debugQuery(obj.sql)
    obj.bindings = this.prepBindings(obj.bindings)
    debugBindings(obj.bindings)
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

  poolDefaults(poolConfig) {
    const name = this.dialect + ':' + this.driverName + ':' + this.__cid
    return {
      min: 2,
      max: 10,
      name: name,
      log(str, level) {
        if (level === 'info') {
          debugPool(level.toUpperCase() + ' pool ' + name + ' - ' + str)
        }
      },
      create: (callback) => {
        this.acquireRawConnection()
          .tap(function(connection) {
            connection.__knexUid = uniqueId('__knexUid')
            if (poolConfig.afterCreate) {
              return Promise.promisify(poolConfig.afterCreate)(connection)
            }
          })
          .asCallback(callback)
      },
      destroy: (connection) => {
        if (poolConfig.beforeDestroy) {
          helpers.warn(`
            beforeDestroy is deprecated, please open an issue if you use this
            to discuss alternative apis
          `)
          poolConfig.beforeDestroy(connection, function() {})
        }
        if (connection !== void 0) {
          this.destroyRawConnection(connection)
        }
      },
      validate: (connection) => {
        if (connection.__knex__disposed) {
          helpers.warn(`Connection Error: ${connection.__knex__disposed}`)
          return false
        }
        return this.validateConnection(connection)
      }
    }
  },

  initializePool(config) {
    if (this.pool) {
      helpers.warn('The pool has already been initialized')
      return
    }
    this.pool = new Pool(assign(this.poolDefaults(config.pool || {}), config.pool))
  },

  validateConnection(connection) {
    return true
  },

  // Acquire a connection from the pool.
  acquireConnection() {
    return new Promise((resolver, rejecter) => {
      if (!this.pool) {
        return rejecter(new Error('Unable to acquire a connection'))
      }
      let wasRejected = false
      const t = setTimeout(() => {
        wasRejected = true
        rejecter(new Promise.TimeoutError(
          'Knex: Timeout acquiring a connection. The pool is probably full. ' +
          'Are you missing a .transacting(trx) call?'
        ))
      }, this.config.acquireConnectionTimeout || 60000)
      this.pool.acquire((err, connection) => {
        clearTimeout(t)
        if (err) {
          return rejecter(err)
        }
        if (wasRejected) {
          this.pool.release(connection)
        } else {
          debug('acquired connection from pool: %s', connection.__knexUid)
          resolver(connection)
        }
      })
    })
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(connection) {
    return new Promise((resolver) => {
      debug('releasing connection to pool: %s', connection.__knexUid)
      this.pool.release(connection)
      resolver()
    })
  },

  // Destroy the current connection pool for the client.
  destroy(callback) {
    const promise = new Promise((resolver) => {
      if (!this.pool) {
        return resolver()
      }
      this.pool.drain(() => {
        this.pool.destroyAllNow(() => {
          this.pool = undefined
          resolver()
        })
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
