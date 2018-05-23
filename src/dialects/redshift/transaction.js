
import Promise from 'bluebird';
import Transaction from '../../transaction';

export default class Redshift_Transaction extends Transaction {
  savepoint(conn) {
    this.client.logger('Redshift does not support savepoints.');
    return Promise.resolve()
  }

  release(conn, value) {
    this.client.logger('Redshift does not support savepoints.');
    return Promise.resolve()
  }

  rollbackTo(conn, error) {
    this.client.logger('Redshift does not support savepoints.');
    return Promise.resolve()
  }
}
