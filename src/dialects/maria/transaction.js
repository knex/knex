
import inherits from 'inherits';
import Debug from 'debug';
import { assign } from 'lodash'
import Transaction from '../../transaction';
import * as helpers from '../../helpers';

const debug = Debug('knex:tx');

function Transaction_Maria() {
  Transaction.apply(this, arguments)
}
inherits(Transaction_Maria, Transaction)

assign(Transaction_Maria.prototype, {

  query(conn, sql, status, value) {
    const t = this
    const q = this.trxClient.query(conn, sql)
      .catch(err => err.code === 1305, () => {
        helpers.warn(
          'Transaction was implicitly committed, do not mix transactions and ' +
          'DDL with MariaDB (#805)'
        );
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

export default Transaction_Maria
