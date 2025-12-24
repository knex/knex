const uniqueId = require('lodash/uniqueId');

const Debug = require('debug');
const debug = Debug('knex:connection-tracker');

class ConnectionTracker {
  constructor() {
    this.conns = new WeakMap();
    this.trxs = new WeakMap();
  }

  addPool(pool) {
    pool.on('acquireSuccess', (_, resc) => {
      const uid = uniqueId('__knexUid');
      this.conns.set(resc, uid);
      debug('assigned uid=%s', uid);
    });
    pool.on('release', (resc) => {
      if (this.trxs.has(resc)) {
        debug(
          'unassigning trxid=%s from uid=%s',
          this.trxid(resc),
          this.uid(resc)
        );
        this.trxs.delete(resc);
      }
    });
    pool.on('destroyRequest', (_, resc) => {
      debug(
        'unassigning trxid=%s and uid=%s',
        this.trxid(resc),
        this.uid(resc)
      );
      this.conns.delete(resc);
      this.trxs.delete(resc);
    });
  }

  transact(resc, txid) {
    const stack = this.trxs.get(resc) ?? [];
    stack.push(txid);
    this.trxs.set(resc, stack);
    debug('assigned trxid=%s to uid=%s', txid, this.uid(resc), stack);
  }

  untransact(resc) {
    const stack = this.trxs.get(resc);
    const last = stack.pop();
    debug('unassigning trxid=%s from uid=%s', last, this.uid(resc), stack);
    if (stack.length === 0) {
      this.trxs.delete(resc);
    } else {
      this.trxs.set(resc, stack);
    }
  }

  withIds(resc, obj) {
    const __knexUid = this.conns.get(resc) ?? 'unknown';
    const res = { __knexUid };

    if (this.trxs.has(resc)) {
      res.__knexTxId = this.trxid(resc);
    }

    return Object.assign(res, obj);
  }

  uid(resc) {
    return this.conns.get(resc) ?? 'unknown';
  }

  trxid(resc) {
    return this.trxs.get(resc)?.[0] ?? 'unknown';
  }

  isTransaction(resc) {
    return this.trxs.has(resc);
  }
}

const tracker = new ConnectionTracker();

module.exports = { tracker };
