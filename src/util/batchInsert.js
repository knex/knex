'use strict';

import {isNumber, isString, isArray, chunk, flatten} from 'lodash';
import Promise from '../promise';

export default class BatchInsert {
	constructor (client, tableName, batch, chunkSize = 1000) {
		if (!isNumber(chunkSize) || chunkSize < 1) {
			throw new TypeError(`Invalid chunkSize: ${chunkSize}`);
		}

		if(!isArray(batch)) {
			throw new TypeError(`Invalid batch: Expected array, got ${typeof batch}`)
		}

		this.client       = client;
		this.tableName    = tableName;
		this.batch        = chunk(batch, chunkSize);
		this._returning   = void 0;
		this._transaction = null;
		this._autoCommit  = true;
	}

	/**
	 * Columns to return from the batch operation.
	 * @param returning
	 */
	returning (returning) {
		if(isArray(returning) || isString(returning)) {
			this._returning = returning;
		}
		return this;
	}

	/**
	 * User may supply their own transaction.
	 * If this is the case, don't autoCommit their transaction. The responsibility falls on the user.
	 * @param transaction
	 */
	transacting (transaction) {
		this._transaction = transaction;
		this._autoCommit = false;
		return this;
	}

	then (callback = function() {}) {
		let transaction;
		return Promise.resolve()
		.then(() => {
				if(this._transaction) {
					transaction = this._transaction;
					return Promise.resolve();
				}
				return new Promise((resolve) => {
					this.client.transaction((tr) => {
						transaction = tr;
						resolve();
					});
				});
			})
		.then(() => {
				return Promise.all(this.batch.map((items) => {
					let promise = transaction(this.tableName)
						.insert(items);
					if(this._returning) {
						promise.returning(this._returning);
					}
					return promise;
				}));
		})
		.then((result) => {
				if(this._autoCommit) {
					transaction.commit();
				}
				return callback(flatten(result || []));
		})
			.catch((error) => {
				if(this._autoCommit) {
					transaction.rollback(error);
				}
				throw error;
			});
	}
}