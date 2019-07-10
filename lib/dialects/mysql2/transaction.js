const Transaction = require('../../transaction');
const debug = require('debug')('knex:tx');

const { isUndefined } = require('lodash');

class Transaction_MySQL2 extends Transaction {}

Object.assign(Transaction_MySQL2.prototype, {
  query(conn, sql, status, value) {
    const t = this;
    const q = this.trxClient
      .query(conn, sql)
      .catch(
        (err) => err.code === 'ER_SP_DOES_NOT_EXIST',
        () => {
          this.trxClient.logger.warn(
            'Transaction was implicitly committed, do not mix transactions and ' +
              'DDL with MySQL (#805)'
          );
        }
      )
      .catch(function(err) {
        status = 2;
        value = err;
        t._completed = true;
        debug('%s error running transaction query', t.txid);
      })
      .then(function(res) {
        if (status === 1) t._resolver(value);
        if (status === 2) {
          if (isUndefined(value)) {
            if (
              sql &&
              sql.toUpperCase() === 'ROLLBACK' &&
              t.doNotRejectOnRollback
            ) {
              t._resolver();
              return;
            }
            value = new Error(`Transaction rejected with non-error: ${value}`);
          }
          t._rejecter(value);
          return res;
        }
      });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  },
});

module.exports = Transaction_MySQL2;
