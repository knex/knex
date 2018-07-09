import Transaction from '../../transaction';
const debug = require('debug')('knex:tx');

import { assign, isUndefined } from 'lodash';

class Transaction_MySQL2 extends Transaction {}

assign(Transaction_MySQL2.prototype, {
  query(conn, sql, status, value) {
    const t = this;
    const q = this.trxClient
      .query(conn, sql)
      .catch(
        (err) => err.code === 'ER_SP_DOES_NOT_EXIST',
        () => {
          this.trxClient.logger.warn(
            'Transaction was implicitly committed, do not mix transactions and' +
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
      .tap(function() {
        if (status === 1) t._resolver(value);
        if (status === 2) {
          if (isUndefined(value)) {
            value = new Error(`Transaction rejected with non-error: ${value}`);
          }
          t._rejecter(value);
        }
      });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  },
});

export default Transaction_MySQL2;
