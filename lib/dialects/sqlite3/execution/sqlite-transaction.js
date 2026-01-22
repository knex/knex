const Transaction = require('../../../execution/transaction');

const {
  isForeignCheckEnabled,
  setForeignCheck,
  executeForeignCheck,
} = require('../schema/internal/sqlite-ddl-operations');

class Transaction_Sqlite extends Transaction {
  // Change the `foreign_keys` pragma if it doesn't match what we want it to be.
  // Return what it should be set to (if anything) when the transaction completes.
  async _setForeignCheck(conn, enforce) {
    // do nothing if we're not explicitly opted in
    if (enforce == null) return null;

    // see what the current pragma is
    const result = await this.client
      .raw(isForeignCheckEnabled())
      .connection(conn);
    const isEnabled = result[0].foreign_keys === 1;

    // do nothing if it's already what we require it to be
    if (enforce === isEnabled) return null;

    // make the change and return what it used to be so we can set it back
    await this.client.raw(setForeignCheck(enforce)).connection(conn);
    return isEnabled;
  }

  // When a boolean is supplied, unconditionally set the `foreign_keys` pragma to
  // the given value. Otherwise do nothing.
  async _restoreForeignCheck(conn, enable) {
    if (typeof enable !== 'boolean') return;
    await this.client.raw(setForeignCheck(enable)).connection(conn);
  }

  // Override Transaction's behavior. Sqlite3 will not error on a `pragma foreign_keys = <value>` statement
  // inside of a transaction; it will just silently not take effect: https://sqlite.org/pragma.html#pragma_foreign_keys
  // To deal with this, we introduce a config option "enforceForeignCheck". When set to a value, Transaction_Sqlite
  // ensures that the transaction received by the caller has this pragma enabled or disabled, and puts it back
  // when the transaction is done.
  async _evaluateContainer(config, container) {
    // this is the same condition used in Transaction._onAcquire() to decide whether to use "BEGIN" or "SAVEPOINT"
    const hasOuterTransaction = this.client.transacting;

    // this is true when our client was created by Client_SQLite3._strict()
    const strictForeignKeyPragma = this.client.strictForeignKeyPragma;

    // this comes from the options bag passed to client.transaction()
    // undefined = wasn't set by caller
    // true      = ensure foreign_keys pragma is enabled within the transaction
    // false     = ensure foreign_keys pragma is disabled within the transaction
    // null      = leave it however it already is
    const enforceForeignCheck = config.enforceForeignCheck;

    // if we're in strict mode, require the caller to be explicit about foreign key
    // constraint requirements
    if (strictForeignKeyPragma === true && enforceForeignCheck === undefined) {
      throw new Error(
        'Refusing to create an unsafe transaction: client.strictForeignKeyPragma is true, but check.enforceForeignCheck is unspecified'
      );
    }

    // call the base class's acquireConnection logic to get ahold of a connection before the transaction is created
    return this.acquireConnection(config, async (conn) => {
      let restoreForeignCheck = undefined;
      try {
        // change the `foreign_keys` pragma if we need to, and decide what we should set it back to, if anything
        restoreForeignCheck = await this._setForeignCheck(
          conn,
          enforceForeignCheck
        );
      } catch (e) {
        // We don't need to dispose the connection here, because none of the things that can throw an error
        // can leave the connection in an unexpected state. Just reject the begin transaction.
        const error = new Error(
          `Refusing to create transaction: failed to set \`foreign_keys\` pragma to the required value of ${enforceForeignCheck}`
        );
        error.cause = e;
        throw error;
      }

      // if:
      // - we're in a nested transaction
      // - _and_ we're in strict mode
      // - _and_ we are required to change the pragma
      // then: we cannot continue, it's out of our hands
      if (
        strictForeignKeyPragma &&
        hasOuterTransaction &&
        restoreForeignCheck !== undefined
      ) {
        throw new Error(
          `Refusing to create transaction: unable to change \`foreign_keys\` pragma inside a nested transaction`
        );
      }

      let maybeWrappedContainer = container;
      if (restoreForeignCheck === true) {
        // in the case where we are turning foreign key checks off for the duration of a transaction,
        // we need to assert that there are no violations once the work of the transaction has been
        // completed. this relies on the fact that Transaction._onAcquire runs the "container" promise
        // to completion before executing "COMMIT"
        maybeWrappedContainer = async (trx) => {
          const res = await container(trx);

          const foreignViolations = await this.client
            .raw(executeForeignCheck())
            .connection(conn);

          if (foreignViolations.length > 0) {
            throw new Error(
              `Transaction concluded with ${foreignViolations.length} foreign key violations`
            );
          }
          return res;
        };
      }

      try {
        // call out to the base class to actually do the work as it normally would
        // note: the await is required here! we need to resolve the promise, not
        // return it
        return await this._onAcquire(maybeWrappedContainer, conn);
      } finally {
        // set the foreign_keys pragma back to what it was before we performed the transaction
        this._restoreForeignCheck(conn, restoreForeignCheck).catch((e) => {
          // we were unable to put it back like we found it. dispose the connection and
          // allow any further queries to re-acquire a new, clean connection
          this._logAndDispose(
            conn,
            'Failed to restore foreign check to expected state',
            e
          );
        });
      }
    });
  }

  _logAndDispose(conn, message, cause) {
    const error = new Error(message);
    error.cause = cause;
    conn.__knex__disposed = error;
    this.client.logger.warn(
      `Transaction_Sqlite: ${message}:\n${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
  }

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
    // SQLite infers read vs write transactions from the statement operation
    // https://www.sqlite.org/lang_transaction.html#read_transactions_versus_write_transactions
    if (this.readOnly) {
      this.client.logger.warn(
        'sqlite3 implicitly handles read vs write transactions'
      );
    }
    return this.query(conn, 'BEGIN;');
  }
}

module.exports = Transaction_Sqlite;
