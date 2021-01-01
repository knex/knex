const Transaction = require('../../../execution/transaction');

class Transaction_Sqlite extends Transaction {
  begin(conn) {
    // SQLite doesn't really support isolation levels, it is serializable by
    // default and so we override it to ignore isolation level.
    // There is a `PRAGMA read_uncommitted = true;`, but that's probably not
    // what the user wants
    if (this.isolationLevel) {
      this.client.logger.warn(
        'sqlite3 only supports serializable transactions, ignoring the isolation level param'
      );
    }
    return this.query(conn, 'BEGIN;');
  }
}

module.exports = Transaction_Sqlite;
