

import { isNumber, isArray, chunk, flatten, assign } from 'lodash';
import Promise from 'bluebird';

export default function batchInsert(client, tableName, batch, chunkSize = 1000) {

  let returning = void 0;
  let autoTransaction = true;
  let transaction = null;

  const getTransaction = () => new Promise((resolve, reject) => {
    if(transaction) {
      return resolve(transaction);
    }

    client.transaction(resolve)
    .catch(reject);
  });

  const wrapper = assign(new Promise((resolve, reject) => {
    const chunks = chunk(batch, chunkSize);

    if(!isNumber(chunkSize) || chunkSize < 1) {
      return reject(new TypeError(`Invalid chunkSize: ${chunkSize}`));
    }

    if(!isArray(batch)) {
      return reject(new TypeError(`Invalid batch: Expected array, got ${typeof batch}`));
    }

    //Next tick to ensure wrapper functions are called if needed
    return Promise.delay(1)
      .then(getTransaction)
      .then((tr) => {
        return Promise.mapSeries(chunks, (items) => tr(tableName).insert(items, returning))
          .then((result) => {
            if(autoTransaction) {
              tr.commit();
            }

            return flatten(result);
          })
          .catch((error) => {
            if(autoTransaction) {
              tr.rollback(error);
            }

            throw error;
          })
      })
      .then(resolve)
      .catch(reject);

  }), {
    returning(columns) {
      returning = columns;

      return this;
    },
    transacting(tr) {
      transaction = tr;
      autoTransaction = false;

      return this;
    }
  });

  return wrapper;
}