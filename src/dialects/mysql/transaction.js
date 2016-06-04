
import Transaction from '../../transaction';
import inherits from 'inherits';
import Debug from 'debug';
import * as helpers from '../../helpers';
import { assign } from 'lodash'

const debug = Debug('knex:tx');

function Transaction_MySQL() {
  Transaction.apply(this, arguments)
}
inherits(Transaction_MySQL, Transaction)

assign(Transaction_MySQL.prototype, {

  query(conn, sql, status, value) {
    const t = this
    const q = this.trxClient.query(conn, sql)
      .catch(err => err.errno === 1305, function() {
        helpers.warn(
          'Transaction was implicitly committed, do not mix transactions and ' +
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
        if (status === 2) t._rejecter(value)
      })
    if (status === 1 || status === 2) {
      t._completed = true
    }
    return q;
  }

})

export default Transaction_MySQL
