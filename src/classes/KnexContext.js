import EventEmitter from 'events'
import debug from 'debug'
import Migrator from '../migrate'
import Seeder from '../seed'
import FunctionHelper from '../functionhelper'
import BatchInsert from './KnexBatchInsert'
import hooksInterface from '../mixins/hooksInterface'
import queryInterface from '../mixins/queryInterface'
import schemaInterface from '../mixins/schemaInterface'
import {
  commitTransaction, rollbackTransaction, transactionContainer
} from '../util/transactionContainer'

const debugQuery = debug('knex:query')

let trxId = 0, ctxId = 0;

export default class KnexContext extends EventEmitter {

  constructor(client, parentContext, config = {}) {
    super()

    // A reference to the current "client" we're dealing with.
    // The client is the object which maintains the connection pool
    // and other dialect-specific SQL builders & chain interfaces.
    this.client = client

    // If a parentContext is provided, we keep a reference and propagate
    // any events up through the parent hierarchy. The presence of a parentContext
    // also signals that this current context isn't the root context, and therefore
    // we keep a log of all executed queries.
    this.__parentContext = parentContext

    // If the context isn't the "root" context, we hang on to a single connection
    // for all queries issues against this context and any sub-contexts. Once the
    // context is ended, we clear the connection.
    this.__connection = null

    // Determine whether the current context is for a transaction, checked to
    // see whether .commit or .rollback are valid calls for this context.
    this.__isTransaction = config.isTransaction || null

    // Set the "status" of the current transaction if we're in one.
    // Statuses include "none", "pending", "fulfilled", "rejected".
    this.__transactionStatus = config.isTransaction ? "pending" : "n/a"

    // Keep an execution log of all queries executed here, if the
    // current context is not the root.
    this.__executionLog = []

    // Helpful in debugging to be able to identify the current context.
    this.__contextId = `ctx${ctxId++}`

    // Events:

    // If we're not in the root context, all events are propagated up through
    // parent context(s)
    if (parentContext) {
      this.on('start', (obj) => {
        parentContext.emit('start', obj)
      })
      this.on('query', (obj) => {
        this.__executionLog.push(obj)
        parentContext.emit('query', obj)
      })
      this.on('query-error', (err, obj) => {
        parentContext.emit('query-error', err, obj)
      })
      this.on('query-response', (response, obj, builder) => {
        parentContext.emit('query-response', response, obj, builder)
      })
    }
  }

  getExecutionLog() {
    return this.__executionLog
  }

  // Implemented as a getter to prevent re-assignment
  get log() {
    return this.client.log
  }

  get migrate() {
    return new Migrator(this)
  }

  get seed() {
    return new Seeder(this)
  }

  get fn() {
    return new FunctionHelper(this)
  }

  // Get the connection for the current context, if we're in a root context we
  // get a random connection out of the pool, otherwise we get & cache the connection
  // on this context.
  async getConnection() {
    if (this.isRootContext()) {
      throw new Error(
        `Cannot getConnection on the root knex instance, ` +
        `create a context or transaction instead`
      )
    }
    if (!this.__connection) {
      if (this.__connection === false) {
        throw new Error(
          `Cannot acquire connection for closed context/transaction ${this.__contextId}`
        )
      }
      if (this.__parentContext.isRootContext()) {
        this.__connection = this.client.acquireConnection()
      } else {
        this.__connection = this.__parentContext.getConnection()
      }
      return this.__connection.then(conn => {
        return this.executeHooks('beforeFirst').then(() => conn)
      })
    }
    return this.__connection
  }

  context(config = {}) {
    const ctx = new KnexContext(this.client, this, {...config, isTransaction: false})
    function knexCtx() {
      return knexCtx.table(...arguments)
    }
    knexCtx.__proto__ = ctx
    return knexCtx
  }

  async commit() {
    return commitTransaction(this)
  }

  async rollback() {
    return rollbackTransaction(this)
  }

  isTransaction() {
    return Boolean(this.__isTransaction)
  }

  isInTransaction() {
    if (this.isTransaction()) {
      return true
    }
    if (this.__parentContext) {
      return this.__parentContext.isInTransaction()
    }
    return false
  }

  isTransactionComplete() {
    if (!this.isTransaction()) {
      this.log.warn('isTransactionComplete should not be called on a non-transaction context')
      return true
    }
    return this.__transactionStatus !== "pending"
  }

  isRootContext() {
    return !this.__parentContext
  }

  end() {
    if (this.isRootContext()) {
      this.log.warn('Cannot call end on a root knex instance, use knex.destroy to destroy the pool')
      return
    }
    this.removeAllListeners()
    if (this.__connection && this.__parentContext.isRootContext()) {
      this.__connection.then(conn => {
        debugQuery(`${conn.__knexUid} ...releasing (end)...`)
        this.client.releaseConnection(conn)
      }).catch(e => {
        // Ignoring error here, since this promise isn't returned and
        // will have already been handled elsewhere
      })
    }
    this.__connection = false
  }

  // Typically never needed, initializes the pool for a knex client.
  initialize(config) {
    if (!this.isRootContext()) {
      this.log.warn(`Cannot call initialize on a non-root object.`)
      return
    }
    return this.client.initialize(config)
  }

  // Destroys the knex instance, tearing down the pool, etc.
  destroy(callback) {
    if (!this.isRootContext()) {
      const value = this.isTransaction() ? '.commit or .rollback' : '.end'
      this.log.warn(`Cannot destroy a non-root knex instance, did you mean to use ${value}?`)
      return
    }
    return this.client.destroy(callback)
  }

  batchInsert(table, batch, chunkSize = 1000) {
    return new BatchInsert(this, table, batch, chunkSize)
  }

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  transaction(config) {
    let container

    if (typeof config === 'function') {
      container = config
      config = {}
    }

    const transactionId = this.isInTransaction() ? `trx${trxId++}` : true

    const trx = new KnexContext(this.client, this, {...config, isTransaction: transactionId})

    function knexTrx() {
      return knexTrx.table(...arguments)
    }
    knexTrx.__proto__ = trx

    // Before the first query runs, we need to ensure the
    // SQL statement for the BEGIN / SAVEPOINT is executed on
    // the context's connection.
    knexTrx.hookOnce('beforeFirst', async () => {
      const isInTransaction = this.isInTransaction()

      // If the driver needs custom transaction behavior (oracle, etc),
      // we allow transaction to be a function instead of a string.
      if (typeof knexTrx.client.transaction === 'function') {
        const transactionType = isInTransaction ? 'savepoint' : 'begin'
        await knexTrx.client.transaction(this, transactionType, transactionId)
      }

      const sql = isInTransaction
        ? knexTrx.client.format(knexTrx.client.transaction.savepoint, transactionId)
        : knexTrx.client.transaction.begin

      await knexTrx.client.query(knexTrx, sql)
    })

    if (container) {
      return transactionContainer(knexTrx, container)
    }

    return knexTrx
  }

  transactionTimeout(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('transactionTimeout requires a valid numeric value')
    }
  }

  raw() {
    return this.client.__raw(this, ...arguments)
  }

  queryBuilder() {
    return this.client.queryBuilder(this)
  }

  schemaBuilder() {
    return this.client.schemaBuilder(this)
  }

  get schema() {
    return schemaInterface(this)
  }

}

// Query Builder Methods
queryInterface(KnexContext)

// Mixin .hook, .hookOnce, etc.
hooksInterface(KnexContext)
