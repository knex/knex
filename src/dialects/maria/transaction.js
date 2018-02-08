import Debug from 'debug';
import Transaction from '../../transaction';
import * as helpers from '../../helpers';
import {isUndefined} from 'lodash';

const debug = Debug('knex:tx');

export default class Transaction_Maria extends Transaction {

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

}
