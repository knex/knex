const Transaction = require('../../transaction');
const debug = require('debug')('knex:tx');

class Transaction_AuroraDataMySQL extends Transaction {
  constructor(client) {
    if (client.transacting) {
      throw new Error(
        'Nested transactions are not supported by the Aurora Data API'
      );
    }

    super(...arguments);
  }

  async begin(conn) {
    if (conn.parameters.transactionId) {
      throw new Error(
        `Attempted to begin a new transaction for connection with existing transaction ${conn.transactionId}`
      );
    }

    const { transactionId } = await conn.client
      .beginTransaction(conn.parameters)
      .promise();
    debug(`Transaction begun with id ${transactionId}`);

    conn.parameters.transactionId = transactionId;

    this._resolver();
  }

  async commit(conn, value) {
    if (!('transactionId' in conn.parameters)) {
      throw new Error(
        'Attempted to commit a transaction when one is not in progress'
      );
    }

    const params = conn.parameters;
    delete params.database;

    const { transactionStatus } = await conn.client
      .commitTransaction(params)
      .promise();
    debug(
      `Transaction ${conn.parameters.transactionId} commit status: ${transactionStatus}`
    );

    delete conn.parameters.transactionId;

    this._resolver(value);
  }

  async rollback(conn, error) {
    if (!('transactionId' in conn.parameters)) {
      throw new Error(
        'Attempted to rollback a transaction when one is not in progress'
      );
    }

    const params = conn.parameters;
    delete params.database;

    const { transactionStatus } = await conn.client
      .rollbackTransaction(params)
      .promise();
    debug(
      `Transaction ${conn.parameters.transactionId} rollback status: ${transactionStatus}`
    );

    delete conn.parameters.transactionId;

    if (error === undefined) {
      if (this.doNotRejectOnRollback) {
        this._resolver();
      } else {
        this._rejecter(
          new Error(`Transaction rejected with non-error: ${error}`)
        );
      }
    } else {
      this._rejecter(error);
    }
  }

  savepoint(conn) {
    throw new Error('Savepoints are not supported by the Aurora Data API');
  }

  release(conn, value) {
    throw new Error('Savepoints are not supported by the Aurora Data API');
  }

  rollbackTo(conn, value) {
    throw new Error('Savepoints are not supported by the Aurora Data API');
  }
}

module.exports = Transaction_AuroraDataMySQL;
