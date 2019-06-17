const Transaction = require('../../transaction');

module.exports = class Redshift_Transaction extends Transaction {
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
