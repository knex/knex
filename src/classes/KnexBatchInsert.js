import { chunk, flatten } from 'lodash';
import Promise from 'bluebird';

export default class BatchInsert {

  constructor(context, tableName, batch, chunkSize = 1000) {
    if (typeof chunkSize !== 'number' || chunkSize < 1) {
      throw new TypeError(`Invalid chunkSize: ${chunkSize}`);
    }
    if (!Array.isArray(batch)) {
      throw new TypeError(`Invalid batch: Expected array, got ${typeof batch}`)
    }

    this.__context = context;
    this.__tableName = tableName;
    this.__batch = chunk(batch, chunkSize);
    this.__returning = null;
    this.__promise = null

    this.__deferredPromise = setTimeout(() => {
      this.then()
    }, 0)
  }

  get log() {
    return this.__context.log
  }

  transacting(t) {
    if (t && t.client) {
      if (!t.isTransaction()) {
        this.log.warn(`Invalid transaction value: ${t.client}`)
      } else {
        this.__context = t
      }
    }
    this.log.warn(
      'BatchInsert.transacting is deprecated, ' +
      'instead use trx.batchInsert on the transaction object.'
    )
    return this;
  }

  /**
   * Columns to return from the batch operation.
   * @param returning
   */
  returning(returning) {
    if (this.__promise) {
      throw new Error('Cannot call BatchInsert.returning after query has started')
    }
    if (Array.isArray(returning) || typeof returning === 'string') {
      this.__returning = returning;
    }
    return this;
  }

  then() {
    clearTimeout(this.__deferredPromise)
    if (!this.__promise) {
      this.__promise = this.__runBatchedQuery()
    }
    return this.__promise.then(...arguments)
  }

  toString() {
    clearTimeout(this.__deferredPromise)
    return this.__batch.map(items => this.__makeChain(items).toString()).join(';\n')
  }

  toSQL() {
    clearTimeout(this.__deferredPromise)
    return this.__batch.map(items => this.__makeChain(items).toSQL())
  }

  __runBatchedQuery() {
    const isInTransaction = this.__context.isInTransaction()
    if (!isInTransaction) {
      this.__context = this.__context.transaction()
    }
    const batched = this.__batch.map(items => this.__makeChain(items))
    return Promise
      .all(batched)
      .then(async (result) => {
        if (!isInTransaction) {
          await this.__context.commit()
        }
        return flatten(result || [])
      })
      .catch(async (e) => {
        if (!isInTransaction) {
          await this.__context.rollback()
        }
        throw e
      })
  }

  __makeChain(items) {
    const chain = this.__context.insert(items).into(this.__tableName)
    if (this.__returning) {
      chain.returning(this.__returning)
    }
    return chain
  }

}
