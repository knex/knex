import Promise from 'bluebird'
import debug from 'debug'
import dedent from 'dedent'
import EventEmitter from 'events'

const debugTx = debug('knex:tx')

export function transactionContainer(trxKnex, container) {
  const p = new Promise((resolve, reject) => {

    // TODO: transaction timeout??

    trxKnex.savepoint = trxKnex.transaction

    const _commit = trxKnex.commit
    const _rollback = trxKnex.rollback

    trxKnex.commit = (value) => {
      return _commit.call(trxKnex).then(() => resolve(value), reject)
    }
    trxKnex.rollback = (err) => {
      return _rollback.call(trxKnex).then(() => reject(err), () => reject(err))
    }

    debugTx('executing transaction container')
    const val = container(trxKnex)

    if (val && typeof val.then === 'function') {
      val.then(trxKnex.commit, trxKnex.rollback)
      return
    }
  })
  const ee = new EventEmitter()
  for (const key in ee) {
    p[key] = ee[key]
  }
  trxKnex.on('start', function() {
    p.emit('start', ...arguments)
  })
  trxKnex.on('query', function() {
    p.emit('query', ...arguments)
  })
  trxKnex.on('query-error', function() {
    p.emit('query-error', ...arguments)
  })
  trxKnex.on('query-response', function() {
    p.emit('query-response', ...arguments)
  })
  return p
}

export async function commitTransaction(ctx) {
  ensureTransaction(ctx)
  const executionCount = ctx.__executionLog.length
  if (executionCount > 0) {
    const {__isTransaction: trxId, client} = ctx
    const {transaction: t} = client
    const sql = trxId === true ? t.commit : client.format(t.releaseSavepoint, trxId)
    const q = ctx.client.query(ctx, sql)
    ctx.__transactionStatus = 'fulfilled'
    await q
  }
  return cleanup(ctx)
}

export async function rollbackTransaction(ctx) {
  ensureTransaction(ctx)
  const executionCount = ctx.__executionLog.length
  if (executionCount > 0) {
    const {__isTransaction: trxId, client} = ctx
    const {transaction: t} = client
    const sql = trxId === true ? t.rollback : client.format(t.rollbackSavepoint, trxId)
    const q = ctx.client.query(ctx, sql)
    ctx.__transactionStatus = 'rejected'
    await q
  }
  return cleanup(ctx)
}

function ensureTransaction(ctx) {
  if (!ctx.isTransaction()) {
    throw new Error(NON_TRANSACTION)
  }
  if (ctx.isTransactionComplete()) {
    throw new Error(COMPLETED_TRANSACTION)
  }
}

function cleanup(ctx) {
  ctx.removeAllListeners()
  ctx.__isTransaction = false
  if (ctx.__connection) {
    if (ctx.__parentContext.isRootContext()) {
      ctx.__connection.then(c => {
        debugTx('Releasing connection ' + c.__knexUid)
        ctx.client.releaseConnection(c)
      })
    } else {
      debugTx('Skipping release, nested transaction')
    }
  }
  ctx.__connection = false
  return ctx
}


const COMPLETED_TRANSACTION = dedent`
  attempting to call commit/rollback multiple times on the same transaction object
`
const NON_TRANSACTION = dedent`
  commit/rollback are only valid on a knex transaction object
`

