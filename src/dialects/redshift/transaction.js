import Promise from 'bluebird';
import { Transaction } from '../../transaction';

export class Redshift_Transaction extends Transaction {
  savepoint(conn) {
    this.trxClient.logger('Redshift does not support savepoints.');
    return Promise.resolve();
  }

  release(conn, value) {
    this.trxClient.logger('Redshift does not support savepoints.');
    return Promise.resolve();
  }

  rollbackTo(conn, error) {
    this.trxClient.logger('Redshift does not support savepoints.');
    return Promise.resolve();
  }
}

export default Redshift_Transaction;
