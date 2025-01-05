const Transaction = require('../../../execution/transaction');

class Transaction_Sqljs extends Transaction {
  begin(conn) {
    // SQLJS doesn't really support isolation levels, it is serializable by
    // default and so we override it to ignore isolation level.
    // There is a `PRAGMA read_uncommitted = true;`, but that's probably not
    // what the user wants
    if (this.isolationLevel) {
      this.client.logger.warn(
        'sqljs only supports serializable transactions, ignoring the isolation level param'
      );
    }
    // SQLJS infers read vs write transactions from the statement operation
    // https://www.sqljs.org/lang_transaction.html#read_transactions_versus_write_transactions
    if (this.readOnly) {
      this.client.logger.warn(
        'sqljs implicitly handles read vs write transactions'
      );
    }
    return this.query(conn, 'BEGIN;');
  }
}

module.exports = Transaction_Sqljs;
