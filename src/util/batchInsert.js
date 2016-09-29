

import { isNumber, isString, isArray, chunk, flatten } from 'lodash';
import Promise from 'bluebird';

export default class BatchInsert {
  constructor(client, tableName, batch, chunkSize = 1000) {
    if(!isNumber(chunkSize) || chunkSize < 1) {
      throw new TypeError(`Invalid chunkSize: ${chunkSize}`);
    }

    if(!isArray(batch)) {
      throw new TypeError(`Invalid batch: Expected array, got ${typeof batch}`)
    }

    this.client = client;
    this.tableName = tableName;
    this.batch = chunk(batch, chunkSize);
    this._returning = void 0;
    this._transaction = null;
    this._autoTransaction = true;

    if (client.transacting) {
      this.transacting(client);
    }
  }

  /**
   * Columns to return from the batch operation.
   * @param returning
   */
  returning(returning) {
    if(isArray(returning) || isString(returning)) {
      this._returning = returning;
    }
    return this;
  }

  /**
   * User may supply their own transaction. If this is the case,
   * `autoTransaction = false`, meaning we don't automatically commit/rollback
   * the transaction. The responsibility instead falls on the user.
   *
   * @param transaction
   */
  transacting(transaction) {
    this._transaction = transaction;
    this._autoTransaction = false;
    return this;
  }

  _getTransaction() {
    return new Promise((resolve) => {
      if(this._transaction) {
        return resolve(this._transaction);
      }
      this.client.transaction((tr) => resolve(tr));
    });
  }

  then(callback = function() {}) {
    return this._getTransaction()
      .then((transaction) => {
        return Promise.all(this.batch.map((items) => {
          return transaction(this.tableName)
            .insert(items, this._returning);
        }))
          .then((result) => {
            if(this._autoTransaction) {
              transaction.commit();
            }
            return callback(flatten(result || []));
          })
          .catch((error) => {
            if(this._autoTransaction) {
              transaction.rollback(error);
            }
            throw error;
          });
      });
  }
}
