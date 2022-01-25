const Transaction = require('../../execution/transaction');
const { timeout, KnexTimeoutError } = require('../../util/timeout');
const debugTx = require('debug')('knex:tx');

// There's also a "read only", but that's not really an "isolationLevel"
const supportedIsolationLevels = ['read committed', 'serializable'];
// Remove this if you make it work and set it to true
const isIsolationLevelEnabled = false;

module.exports = class Oracle_Transaction extends Transaction {
  // disable autocommit to allow correct behavior (default is true)
  begin(conn) {
    if (this.isolationLevel) {
      if (isIsolationLevelEnabled) {
        if (!supportedIsolationLevels.includes(this.isolationLevel)) {
          this.client.logger.warn(
            'Oracle only supports read committed and serializable transactions, ignoring the isolation level param'
          );
        } else {
          // I tried this, but it didn't work
          // Doc here: https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SET-TRANSACTION.html
          return this.query(conn, `SET TRANSACTION ${this.isolationLevel}`);
        }
      } else {
        this.client.logger.warn(
          'Transaction isolation is not currently supported for Oracle'
        );
      }
    }
    return Promise.resolve();
  }

  async commit(conn, value) {
    this._completed = true;
    try {
      await conn.commitAsync();
      this._resolver(value);
    } catch (err) {
      this._rejecter(err);
    }
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return timeout(conn.rollbackAsync(), 5000)
      .catch((e) => {
        if (!(e instanceof KnexTimeoutError)) {
          return Promise.reject(e);
        }
        this._rejecter(e);
      })
      .then(() => {
        if (err === undefined) {
          if (this.doNotRejectOnRollback) {
            this._resolver();
            return;
          }
          err = new Error(`Transaction rejected with non-error: ${err}`);
        }
        this._rejecter(err);
      });
  }

  savepoint(conn) {
    return this.query(conn, `SAVEPOINT ${this.txid}`);
  }

  async acquireConnection(config, cb) {
    const configConnection = config && config.connection;

    const connection =
      configConnection || (await this.client.acquireConnection());
    try {
      connection.__knexTxId = this.txid;
      connection.isTransaction = true;
      return await cb(connection);
    } finally {
      debugTx('%s: releasing connection', this.txid);
      connection.isTransaction = false;
      try {
        await connection.commitAsync();
      } catch (err) {
        this._rejecter(err);
      } finally {
        if (!configConnection) {
          await this.client.releaseConnection(connection);
        } else {
          debugTx('%s: not releasing external connection', this.txid);
        }
      }
    }
  }
};
