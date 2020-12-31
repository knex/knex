const Transaction = require('../../execution/transaction');

module.exports = class Redshift_Transaction extends Transaction {
  begin(conn) {
    if (this.isolationLevel) {
      return this.query(conn, `BEGIN ISOLATION LEVEL ${this.isolationLevel};`);
    }
    return this.query(conn, 'BEGIN;');
  }

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
};
