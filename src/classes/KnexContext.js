import Promise from 'bluebird'
import EventEmitter from 'events'
import dedent from 'dedent'

import Migrator from '../migrate'
import Seeder from '../seed'
import FunctionHelper from '../functionhelper'
import BatchInsert from '../util/batchInsert'
import {commit, rollback, transactionContainer} from '../util/transactionContainer'

let id = 0
function getTrxId() {
  return `trx${id++}`
}

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

    // Keep an execution log of all queries executed here, if the
    // current context is not the root.
    this.__executionLog = []

    // Events:

    // If we're not in the root context, all events are propagated up through
    // parent context(s)
    if (parentContext) {
      this.on('start', (obj) => {
        parentContext.emit('start', obj)
      })
      this.on('query', (obj) => {
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

  get schema() {
    return this.schemaBuilder()
  }

  context(config) {

  }

  commit() {
    return Promise.resolve(true)
    return new Promise((resolve, reject) => {
      if (!this.isTransaction()) {
        return reject(new Error(
          this.__isTransaction === false ? COMPLETED_TRANSACTION : NON_TRANSACTION
        ))
      }
      return commit(this, resolve)
    })
  }

  rollback() {
    return Promise.reject(new Error())
    return new Promise((resolve, reject) => {
      if (!this.isTransaction()) {
        return reject(new Error(
          this.__isTransaction === false ? COMPLETED_TRANSACTION : NON_TRANSACTION
        ))
      }
      return rollback(this, resolve)
    })
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

    const trxId = this.isInTransaction() ? getTrxId() : true

    const trx = new KnexContext(this.client, this, {isTransaction: trxId})

    function knexTrx() {
      return trx.table(...arguments)
    }
    knexTrx.__proto__ = trx
    // knexTrx.hook('beforeFirst', () => {
    //   if (this.isInTransaction()) {
    //   }
    // })

    if (container) {
      return transactionContainer(knexTrx, container)
    }
    return knexTrx
  }

  raw() {
    return this.client.raw(...arguments)
  }

  queryBuilder() {
    return this.client.queryBuilder(this)
  }

  schemaBuilder() {
    return this.client.schemaBuilder(this)
  }

  // Query Builder Methods

  with() {
    return this.queryBuilder().with(...arguments)
  }
  select() {
    return this.queryBuilder().select(...arguments)
  }
  as() {
    return this.queryBuilder().as(...arguments)
  }
  columns() {
    return this.queryBuilder().columns(...arguments)
  }
  column() {
    return this.queryBuilder().column(...arguments)
  }
  from() {
    return this.queryBuilder().from(...arguments)
  }
  fromJS() {
    return this.queryBuilder().fromJS(...arguments)
  }
  into() {
    return this.queryBuilder().into(...arguments)
  }
  withSchema() {
    return this.queryBuilder().withSchema(...arguments)
  }
  table() {
    return this.queryBuilder().table(...arguments)
  }
  distinct() {
    return this.queryBuilder().distinct(...arguments)
  }
  join() {
    return this.queryBuilder().join(...arguments)
  }
  joinRaw() {
    return this.queryBuilder().joinRaw(...arguments)
  }
  innerJoin() {
    return this.queryBuilder().innerJoin(...arguments)
  }
  leftJoin() {
    return this.queryBuilder().leftJoin(...arguments)
  }
  leftOuterJoin() {
    return this.queryBuilder().leftOuterJoin(...arguments)
  }
  rightJoin() {
    return this.queryBuilder().rightJoin(...arguments)
  }
  rightOuterJoin() {
    return this.queryBuilder().rightOuterJoin(...arguments)
  }
  outerJoin() {
    return this.queryBuilder().outerJoin(...arguments)
  }
  fullOuterJoin() {
    return this.queryBuilder().fullOuterJoin(...arguments)
  }
  crossJoin() {
    return this.queryBuilder().crossJoin(...arguments)
  }
  where() {
    return this.queryBuilder().where(...arguments)
  }
  andWhere() {
    return this.queryBuilder().andWhere(...arguments)
  }
  orWhere() {
    return this.queryBuilder().orWhere(...arguments)
  }
  whereNot() {
    return this.queryBuilder().whereNot(...arguments)
  }
  orWhereNot() {
    return this.queryBuilder().orWhereNot(...arguments)
  }
  whereRaw() {
    return this.queryBuilder().whereRaw(...arguments)
  }
  whereWrapped() {
    return this.queryBuilder().whereWrapped(...arguments)
  }
  havingWrapped() {
    return this.queryBuilder().havingWrapped(...arguments)
  }
  orWhereRaw() {
    return this.queryBuilder().orWhereRaw(...arguments)
  }
  whereExists() {
    return this.queryBuilder().whereExists(...arguments)
  }
  orWhereExists() {
    return this.queryBuilder().orWhereExists(...arguments)
  }
  whereNotExists() {
    return this.queryBuilder().whereNotExists(...arguments)
  }
  orWhereNotExists() {
    return this.queryBuilder().orWhereNotExists(...arguments)
  }
  whereIn() {
    return this.queryBuilder().whereIn(...arguments)
  }
  orWhereIn() {
    return this.queryBuilder().orWhereIn(...arguments)
  }
  whereNotIn() {
    return this.queryBuilder().whereNotIn(...arguments)
  }
  orWhereNotIn() {
    return this.queryBuilder().orWhereNotIn(...arguments)
  }
  whereNull() {
    return this.queryBuilder().whereNull(...arguments)
  }
  orWhereNull() {
    return this.queryBuilder().orWhereNull(...arguments)
  }
  whereNotNull() {
    return this.queryBuilder().whereNotNull(...arguments)
  }
  orWhereNotNull() {
    return this.queryBuilder().orWhereNotNull(...arguments)
  }
  whereBetween() {
    return this.queryBuilder().whereBetween(...arguments)
  }
  whereNotBetween() {
    return this.queryBuilder().whereNotBetween(...arguments)
  }
  andWhereBetween() {
    return this.queryBuilder().andWhereBetween(...arguments)
  }
  andWhereNotBetween() {
    return this.queryBuilder().andWhereNotBetween(...arguments)
  }
  orWhereBetween() {
    return this.queryBuilder().orWhereBetween(...arguments)
  }
  orWhereNotBetween() {
    return this.queryBuilder().orWhereNotBetween(...arguments)
  }
  groupBy() {
    return this.queryBuilder().groupBy(...arguments)
  }
  groupByRaw() {
    return this.queryBuilder().groupByRaw(...arguments)
  }
  orderBy() {
    return this.queryBuilder().orderBy(...arguments)
  }
  orderByRaw() {
    return this.queryBuilder().orderByRaw(...arguments)
  }
  union() {
    return this.queryBuilder().union(...arguments)
  }
  unionAll() {
    return this.queryBuilder().unionAll(...arguments)
  }
  having() {
    return this.queryBuilder().having(...arguments)
  }
  havingRaw() {
    return this.queryBuilder().havingRaw(...arguments)
  }
  orHaving() {
    return this.queryBuilder().orHaving(...arguments)
  }
  orHavingRaw() {
    return this.queryBuilder().orHavingRaw(...arguments)
  }
  offset() {
    return this.queryBuilder().offset(...arguments)
  }
  limit() {
    return this.queryBuilder().limit(...arguments)
  }
  count() {
    return this.queryBuilder().count(...arguments)
  }
  countDistinct() {
    return this.queryBuilder().countDistinct(...arguments)
  }
  min() {
    return this.queryBuilder().min(...arguments)
  }
  max() {
    return this.queryBuilder().max(...arguments)
  }
  sum() {
    return this.queryBuilder().sum(...arguments)
  }
  sumDistinct() {
    return this.queryBuilder().sumDistinct(...arguments)
  }
  avg() {
    return this.queryBuilder().avg(...arguments)
  }
  avgDistinct() {
    return this.queryBuilder().avgDistinct(...arguments)
  }
  increment() {
    return this.queryBuilder().increment(...arguments)
  }
  decrement() {
    return this.queryBuilder().decrement(...arguments)
  }
  first() {
    return this.queryBuilder().first(...arguments)
  }
  debug() {
    return this.queryBuilder().debug(...arguments)
  }
  pluck() {
    return this.queryBuilder().pluck(...arguments)
  }
  insert() {
    return this.queryBuilder().insert(...arguments)
  }
  update() {
    return this.queryBuilder().update(...arguments)
  }
  returning() {
    return this.queryBuilder().returning(...arguments)
  }
  del() {
    return this.queryBuilder().del(...arguments)
  }
  delete() {
    return this.queryBuilder().delete(...arguments)
  }
  truncate() {
    return this.queryBuilder().truncate(...arguments)
  }
  transacting() {
    return this.queryBuilder().transacting(...arguments)
  }
  connection() {
    return this.queryBuilder().connection(...arguments)
  }

}

const COMPLETED_TRANSACTION = dedent`
  attempting to call commit/rollback multiple times on the same transaction object
`
const NON_TRANSACTION = dedent`
  commit/rollback are only valid on a knex transaction object
`

