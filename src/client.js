import Promise from 'bluebird';
import consoleLogger from './util/consoleLogger'

import Raw from './raw';
import Runner from './runner';
import Formatter from './formatter';

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
  this.log = consoleLogger
  this.config = config
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

  transaction: {
    begin: 'BEGIN',
    savepoint: 'SAVEPOINT %s',
    commit: 'COMMIT',
    releaseSavepoint: 'RELEASE SAVEPOINT %s',
    rollback: 'ROLLBACK',
    rollbackSavepoint: 'ROLLBACK TO SAVEPOINT %s'
  },

  formatter() {
    return new Formatter(this)
  },

  format(fmt) {
    let i = 1;
    const args = arguments;
    return fmt.replace(/%([%sILQ])/g, (_, type) => {
      if ('%' == type) return '%';
      const arg = args[i++];
      switch (type) {
        case 's': return String(arg == null ? '' : arg)
        case 'I': return this.ident(arg)
        case 'L': return this.literal(arg)
      }
    });
  },

  ident(value) {

  },

  literal(value) {

  },

  raw() {
    return this.__raw({client: this}, ...arguments)
  },

  __raw(context, ...rest) {
    return new Raw(context).set(...rest)
  },

  queryBuilder(context) {
    return new QueryBuilder(context)
  },

  schemaBuilder(context) {
    return new SchemaBuilder(context)
  },

  queryCompiler(builder) {
    return new QueryCompiler(this, builder)
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
    return new Runner(builder)
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

  async query(context, obj) {

    if (typeof obj === 'string') {
      obj = {sql: obj}
    }

    ensureValidContext(context, obj.sql)

    let connection
    try {
      connection = await context.isRootContext()
        ? context.client.acquireConnection()
        : context.getConnection()

      obj.bindings = this.prepBindings(obj.bindings)

      debugQuery(`${connection.__knexUid} - ${obj.sql}`)
      debugBindings(obj.bindings)

      this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
      context.emit('query', assign({__knexUid: connection.__knexUid}, obj))

      return await this._query(context, connection, obj)
    } catch (err) {
      const formattedSql = this._formatQuery(obj.sql, obj.bindings)
      err.message = `${err.message} - ${formattedSql}`
      err.sql = obj.sql
      err.bindings = obj.bindings

      // TODO: conn ident for errors... assign({__knexUid: connection.__knexUid}, obj)
      this.emit('query-error', err, obj)
      context.emit('query-error', err, obj)
      throw err
    } finally {
      if (connection) {
        if (context.isRootContext()) {
          debugQuery(`${connection.__knexUid} ...releasing (query)...`)
          this.releaseConnection(connection)
        } else {
          debugQuery(`${connection.__knexUid} ...keeping...`)
        }
      }
    }
  },

  async stream(context, obj, passThroughStream, options) {

    if (typeof obj === 'string') {
      obj = {sql: obj}
    }

    ensureValidContext(context, obj.sql)

    let connection
    try {
      connection = await context.isRootContext()
        ? context.client.acquireConnection()
        : context.getConnection()

      this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
      context.emit('query', assign({__knexUid: connection.__knexUid}, obj))

      debugQuery(obj.sql)

      obj.bindings = this.prepBindings(obj.bindings)

      debugBindings(obj.bindings)

      return await this._stream(context, connection, obj, passThroughStream, options)
    } finally {
      if (connection && context.isRootContext()) {
        this.releaseConnection(connection)
      }
    }
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
      this.log.error(`Knex: run\n$ npm install ${this.driverName} --save\n${e.stack}`)
      process.exit()
    }
  },

  poolDefaults(poolConfig) {
    const name = this.dialect + ':' + this.driverName + ':' + this.__cid
    return {
      min: 2,
      max: 10,
      name: name,
      // returnToHead: true,
      log(str, level) {
        debugPool(level.toUpperCase() + ' pool ' + name + ' - ' + str)
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
          this.log.warn(`
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
          this.log.warn(`Connection Error: ${connection.__knex__disposed}`)
          return false
        }
        return this.validateConnection(connection)
      }
    }
  },

  initializePool(config) {
    if (this.pool) {
      this.log.warn('The pool has already been initialized')
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
      let rejected
      const timeout = this.config.acquireConnectionTimeout || 60000
      const t = setTimeout(() => {
        rejected = true
        rejecter(new Error(
          `Knex: Timeout acquiring a connection. ` +
          `The pool is probably full. ` +
          `Are you missing a .transacting(trx) call?`
        ))
      }, timeout)
      this.pool.acquire((err, connection) => {
        clearTimeout(t)
        if (err) {
          return rejecter(err)
        }
        if (rejected) {
          return this.releaseConnection(connection)
        }
        debug('acquired connection from pool: %s', connection.__knexUid)
        resolver(connection)
      })
    })
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(connection) {
    debug('releasing connection to pool: %s', connection.__knexUid)
    this.pool.release(connection)
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

function ensureValidContext(context, sql) {
  if (context.isTransaction() && context.isTransactionComplete()) {
    throw new Error(
      `Transaction has already been ${context.__transactionStatus}, ` +
      `cannot execute query ${sql}`
    )
  }
}

export default Client


