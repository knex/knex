import Promise from 'bluebird'

export function transactionContainer(trxKnex, container) {
  return new Promise((resolve, reject) => {

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

    const val = container(trxKnex)

    if (val && typeof val.then === 'function') {
      val.then(trxKnex.commit, trxKnex.rollback)
      return
    }
  })
}

export async function commit(ctx, resolve) {
  const executionCount = ctx.__executionLog.length
  if (executionCount.length > 0) {
    const {__isTransaction: trxId, client} = ctx
    const {transaction: t} = client
    const sql = trxId === true ? t.commit : client.format(t.releaseSavepoint, trxId)
    await ctx.client.query(ctx, sql)
  }
  return cleanup(ctx)
}

export async function rollback(ctx, resolve) {
  const executionCount = ctx.__executionLog.length
  if (executionCount.length > 0) {
    const {__isTransaction: trxId, client} = ctx
    const {transaction: t} = client
    const sql = trxId === true ? t.rollback : client.format(t.rollbackSavepoint, trxId)
    await ctx.client.query(ctx, sql)
  }
  return cleanup(ctx)
}

function cleanup(ctx) {
  ctx.removeListeners()
  ctx.__isTransaction = false
  return ctx
}
