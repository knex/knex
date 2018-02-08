
import Transaction from '../../transaction';
import inherits from 'inherits';
const debug = require('debug')('knex:tx')
import * as helpers from '../../helpers';

import { assign, isUndefined } from 'lodash'

function Transaction_MySQL2() {
  Transaction.apply(this, arguments)
}
inherits(Transaction_MySQL2, Transaction)

assign(Transaction_MySQL2.prototype, {

  query(conn, sql, status, value) {
    const t = this
    const q = this.trxClient.query(conn, sql)
      .catch(err => err.code === 'ER_SP_DOES_NOT_EXIST', function() {
        helpers.warn(
          'Transaction was implicitly committed, do not mix transactions and' +
          'DDL with MySQL (#805)'
        )
      })
      .catch(function(err) {
        status = 2
        value = err
        t._completed = true
        debug('%s error running transaction query', t.txid)
      })
      .tap(function() {
        if (status === 1) t._resolver(value)
        if (status === 2) {
          if(isUndefined(value)) {
            value = new Error(`Transaction rejected with non-error: ${value}`)
          }
          t._rejecter(value)
        }
      })
    if (status === 1 || status === 2) {
      t._completed = true
    }
    return q;
  }

})

export default Transaction_MySQL2
