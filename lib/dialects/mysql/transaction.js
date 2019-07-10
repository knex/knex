const Transaction = require('../../transaction');
const Debug = require('debug');
const { isUndefined } = require('lodash');

const debug = Debug('knex:tx');

class Transaction_MySQL extends Transaction {}

Object.assign(Transaction_MySQL.prototype, {
  query(conn, sql, status, value) {
    const t = this;
    const q = this.trxClient
      .query(conn, sql)
      .catch(
        (err) => err.errno === 1305,
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
        }
        return res;
      });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  },
});

module.exports = Transaction_MySQL;
