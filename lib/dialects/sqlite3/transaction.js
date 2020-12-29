const Transaction = require('../../execution/transaction');

class Transaction_Sqlite extends Transaction {
  begin(conn) {
    // SQLite doesn't really support isolation levels, it is serializable by
    // default and so we override it to ignore isolation level.
    // There is a `PRAGMA read_uncommitted = true;`, but that's probably not
    // what the user wants
    //
    // As a style choice the alternative is to throw an error here if an
    // isolation level is set, but the default doesn't make sense as it doesn't
    // produce a useful error message
    return this.query(conn, 'BEGIN;');
  }
}

module.exports = Transaction_Sqlite;
