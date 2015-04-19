'use strict';

var Promise        = require('./promise')
var helpers        = require('./helpers')

var Raw            = require('./raw')
var Runner         = require('./runner')
var Formatter      = require('./formatter')
var Transaction    = require('./transaction')

var QueryBuilder   = require('./query/builder')
var QueryCompiler  = require('./query/compiler')

var SchemaBuilder  = require('./schema/builder')
var SchemaCompiler = require('./schema/compiler')
var TableBuilder   = require('./schema/tablebuilder')
var TableCompiler  = require('./schema/tablecompiler')
var ColumnBuilder  = require('./schema/columnbuilder')
var ColumnCompiler = require('./schema/columncompiler')

var Pool2          = require('pool2')
var inherits       = require('inherits')
var EventEmitter   = require('events').EventEmitter

var assign         = require('lodash/object/assign')
var uniqueId       = require('lodash/utility/uniqueId')
var cloneDeep      = require('lodash/lang/cloneDeep')

// The base client provides the general structure
// for a dialect specific client object.
function Client(config) {
  this.config      = config
  this.transacting = false
  if (this.driverName && config.connection) {
    this.initializeDriver()
    this.initializePool(config)
  }
}
inherits(Client, EventEmitter)

assign(Client.prototype, {

  Formatter: Formatter,

  formatter: function() {
    return new this.Formatter(this)
  },

  QueryBuilder: QueryBuilder,

  queryBuilder: function() {
    return new this.QueryBuilder(this)
  },

  QueryCompiler: QueryCompiler,

  queryCompiler: function(builder) {
    return new this.QueryCompiler(this, builder)
  },

  SchemaBuilder: SchemaBuilder,

  schemaBuilder: function() {
    return new this.SchemaBuilder(this)
  },

  SchemaCompiler: SchemaCompiler,

  schemaCompiler: function(builder) {
    return new this.SchemaCompiler(this, builder)
  },

  TableBuilder: TableBuilder,

  tableBuilder: function() {
    return new this.TableBuilder(this)
  },

  TableCompiler: TableCompiler,

  tableCompiler: function(tableBuilder) {
    return new this.TableCompiler(this, tableBuilder)
  },

  ColumnBuilder: ColumnBuilder,

  columnBuilder: function() {
    return new this.ColumnBuilder(this)
  },

  ColumnCompiler: ColumnCompiler,

  columnCompiler: function(tableBuilder, columnBuilder) {
    return new this.ColumnCompiler(this, tableBuilder, columnBuilder)
  },

  Runner: Runner,

  runner: function(connection) {
    return new this.Runner(this, connection)
  },

  Transaction: Transaction,

  transaction: function(container) {
    return new this.Transaction(this).run(container)
  },

  Raw: Raw,

  raw: function(sql, bindings) {
    var raw = new this.Raw(this)
    return raw.set.apply(raw, arguments)
  },

  wrapIdentifier: function(value) {
    return (value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*')
  },

  initializeDriver: function() {
    this.driver = require(this.driverName)
  },

  Pool: Pool2,

  initializePool: function(config) {
    this.connectionSettings = cloneDeep(config.connection)
    if (this.pool) this.destroy()
    this.pool = new this.Pool(_.extend(this.poolDefaults(config.pool), config.pool))
    this.pool.on('error', function(err) {
      helpers.error('Pool2 - ' + err)
    })
    this.pool.on('warn', function(msg) {
      helpers.warn('Pool2 - ' + msg)
    })
  },

  poolDefaults: function(poolConfig) {
    var dispose, client = this
    if (poolConfig.destroy) {
      deprecate('config.pool.destroy', 'config.pool.dispose')
      dispose = poolConfig.destroy
    }
    return {
      min: 2,
      max: 10,
      acquire: function(callback) {
        client.acquireRawConnection()
          .tap(function(connection) {
            connection.__knexUid = _.uniqueId('__knexUid')
            if (poolConfig.afterCreate) {
              return Promise.promisify(poolConfig.afterCreate)(connection)
            }
          })
          .nodeify(callback)
      },
      dispose: function(connection, callback) {
        if (poolConfig.beforeDestroy) {
          poolConfig.beforeDestroy(connection, function() {
            if (connection !== undefined) {
              client.destroyRawConnection(connection, callback)
            }
          })
        } else if (connection !== void 0) {
          client.destroyRawConnection(connection, callback)
        }
      }
    }
  },

  // Acquire a connection from the pool.
  acquireConnection: function() {
    var client = this
    return new Promise(function(resolver, rejecter) {
      if (!client.pool) {
        return rejecter(new Error('There is no pool defined on the current client'))
      }
      client.pool.acquire(function(err, connection) {
        if (err) return rejecter(err)
        resolver(connection)
      })
    })
  },

  // Releases a connection from the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection: function(connection) {
    var pool = this.pool
    return new Promise(function(resolver, rejecter) {
      pool.release(connection) 
      resolver()
    })
  },

  // Destroy the current connection pool for the client.
  destroy: function(callback) {
    var client = this
    var promise = new Promise(function(resolver, rejecter) {
      if (!client.pool) return resolver()
      client.pool.end(function() {
        client.pool = undefined
        resolver()
      })
    })
    // Allow either a callback or promise interface for destruction.
    if (typeof callback === 'function') {
      promise.nodeify(callback)
    } else {
      return promise
    }
  },

  // Return the database being used by this client.
  database: function() {
    return this.databaseName || this.connectionSettings.database
  }

})

module.exports = Client
