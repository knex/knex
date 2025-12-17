// @ts-check

const { nanoid } = require('../../../lib/util/nanoid');
const { Client } = require('../../../lib');
const makeKnex = require('../../../lib/knex-builder/make-knex');
const { PassThrough } = require('stream');

/** @typedef {import('../../../types/index').Knex} Knex */
/** @typedef {import('../../../types/index').Knex.QueryBuilder} QueryBuilder */
/** @typedef {import('../../../lib/query/querycompiler').QueryMethod} QueryMethod */
/** @typedef {import('../../../lib/query/querycompiler').ProcessResponseQueryObject<any, any> & {__match?: string}} ProcessResponseQueryObject */
/** @typedef {import('../../../lib/execution/runner').QueryResult} QueryResult */

// for the purposes of exercising the runner, the database we're
// talking to is irrelevant, so these can all be unit tests. however,
// the classes have a lot of coupling, so we'll make a fake client
// to handle the business of simulating an arbitrary database client
class MockClient extends Client {
  /**
   * @param {any} opts
   */
  constructor(opts = {}) {
    super({ ...opts, client: {} });
  }

  /** @type  {Error[]} */
  connectionErrors = [];

  /**
   * @param {Error} err
   */
  _nextConnection(err) {
    this.connectionErrors.push(err);
  }

  /** @type {any} */
  lastConnection = undefined;

  async acquireConnection() {
    const err = this.connectionErrors.shift();
    if (err) return Promise.reject(err);
    const conn = {
      __knexUid: nanoid(),
      // transactions make a fake client that doesn't
      // inherit from us, so they lose the mock responses
      responses: this.nextQueryResponse,
    };
    this.lastConnection = conn;
    return conn;
  }

  async releaseConnection() {}

  /** @type {ProcessResponseQueryObject[]} */
  nextQueryResponse = [];

  /**
   * @param {any} response
   * @param {object} [other]
   */
  _nextResponse(response, other) {
    this.nextQueryResponse.push({
      method: /** @type {QueryMethod} */ ('mock'),
      response,
      ...other,
    });
  }

  /**
   * @param {string} sql
   * @param {any} response
   */
  _matchResponse(sql, response) {
    this.nextQueryResponse.push({
      method: /** @type {QueryMethod} */ ('mock'),
      __match: sql,
      response,
    });
  }

  /**
   * @param {any} conn
   * @param {QueryResult} query
   * @returns {Promise<ProcessResponseQueryObject>}
   */
  async _query(conn, query) {
    const mockSource = this.nextQueryResponse ?? conn.responses;
    const mocked = mockSource.shift();

    if (mocked) {
      const { response, __match, ...rest } = mocked;
      if (__match && __match !== query.sql) {
        mockSource.unshift(mocked);
        return {
          method: /** @type {QueryMethod} */ ('mock'),
          response: 'no matched sql',
        };
      }

      query.response = await response;
      Object.assign(query, rest);
    }

    const { pluck, ...rest } = query;
    return {
      pluck: (row) => row[/** @type {string} */ (pluck)],
      ...rest,
    };
  }

  /**
   * @param {any} conn
   * @param {QueryResult} query
   * @param {any} stream
   * @param {any} options
   * @returns {void}
   */
  _stream(conn, query, stream, options) {
    const rows = this.nextQueryResponse.splice(0);

    // also exercise the 'pipe' event on Runner's transform stream
    const pt = new PassThrough({ objectMode: true });

    pt.pipe(stream);

    for (const row of rows) {
      pt.write(row.response);
    }
    pt.end();
  }

  /** @type {any} */
  lastCancelled = undefined;

  /** @type {boolean} */
  canCancelQuery = true;

  /** @type {Promise<any>|undefined} */
  cancelPromise = undefined;

  /**
   * @param {Promise<any>} promise
   */
  _nextCancel(promise) {
    this.cancelPromise = promise;
  }

  /** @param {any} conn */
  async cancelQuery(conn) {
    this.lastCancelled = conn;
    const cancelPromise = this.cancelPromise ?? Promise.resolve();
    this.cancelPromise = undefined;
    return cancelPromise;
  }

  /**
   * @param {import('../../../lib/query/querycompiler').ProcessResponseQueryObject<any, any>} query
   * @returns {any}
   */
  processResponse(query) {
    if (query.queryContext === 'raw') return query;

    if (query.method === 'first') {
      return query.response[0];
    } else {
      return query.response;
    }
  }

  /**
   * @param {QueryBuilder[]} builders
   */
  _runMultiple(builders) {
    return this.runner({
      emit: () => {},
      queryContext: () => undefined,
      toSQL: () => builders.map((b) => /** @type {any} */ (b).toSQL()),
    }).run();
  }

  /**
   * @param {string[]} pre
   * @param {string[]} sql
   * @param {string[]} post
   * @param {string} check
   */
  _runProducer(pre, sql, post, check) {
    return this.runner(
      Object.assign(this.queryBuilder().select(1), {
        toSQL: () => [
          {
            bindings: [],
            statementsProducer: () => ({ pre, sql, post, check }),
          },
        ],
      })
    ).run();
  }
}

const mockKnex = /** @param {any} opts */ (opts = {}) => {
  const client = new MockClient(opts);
  const knex = /** @type {Knex} */ (makeKnex(client));
  return { client, knex };
};

module.exports = { MockClient, mockKnex };
