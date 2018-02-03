
import Promise from 'bluebird';
import { warn } from '../../helpers';
import Transaction from '../../transaction';

export default class Redshift_Transaction extends Transaction {
  savepoint(conn) {
    warn('Redshift does not support savepoints.');
    return Promise.resolve()
  }

  release(conn, value) {
    warn('Redshift does not support savepoints.');
    return Promise.resolve()
  }

  rollbackTo(conn, error) {
    warn('Redshift does not support savepoints.');
    return Promise.resolve()
  }
}
