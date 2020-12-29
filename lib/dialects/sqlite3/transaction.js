const Transaction = require('../../execution/transaction');

class Transaction_Sqlite extends Transaction {
  begin(conn) {
    const setIsolationLevel = this.isolationLevel
      ? this.query(conn, `PRAGMA read_uncommitted = true;`)
      : Promise.resolve();
    return setIsolationLevel.then(() => this.query(conn, 'BEGIN;'));
  }
}

module.exports = Transaction_Sqlite;
