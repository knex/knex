import Transaction from '../../transaction';
import Debug from 'debug';

const debug = Debug('knex:tx');

export default class Transaction_Firebird extends Transaction {
  begin(conn) {
    return this.query(conn, 'SET TRANSACTION');
  }

  query(conn, sql, status, value) {
    const t = this;
    const q = this.trxClient
      .query(conn, sql)
      .catch(
        (err) => err.errno === 1305,
        () => {
          this.trxClient.logger.warn(
            'Transaction was implicitly committed, do not mix transactions and DDL with Firebird (#805)'
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
        if (status === 2) t._rejecter(value);
      });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  }
}
