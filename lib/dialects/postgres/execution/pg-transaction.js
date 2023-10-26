const Transaction = require('../../../execution/transaction');

class Transaction_PG extends Transaction {
  begin(conn) {
    const trxMode = [
      this.isolationLevel ? `ISOLATION LEVEL ${this.isolationLevel}` : '',
      this.readOnly ? 'READ ONLY' : '',
    ]
      .join(' ')
      .trim();

    if (trxMode.length === 0) {
      return this.query(conn, 'BEGIN;');
    }
    return this.query(conn, `BEGIN TRANSACTION ${trxMode};`);
  }
}

module.exports = Transaction_PG;
