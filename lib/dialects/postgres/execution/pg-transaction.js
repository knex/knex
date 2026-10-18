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

  commit(conn, value) {
    // PostgreSQL answers COMMIT with ROLLBACK if an earlier statement failed.
    // Inspect that response before settling the transaction's execution promise.
    const promise = this.query(conn, 'COMMIT;').then((res) => {
      if (res?.response?.command === 'ROLLBACK') {
        this._rejecter(
          new Error('Transaction was rolled back by the database')
        );
      } else if (res) {
        this._resolver(value);
      }
      return res;
    });
    this._completed = true;
    return promise;
  }
}

module.exports = Transaction_PG;
