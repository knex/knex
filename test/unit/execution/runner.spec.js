// @ts-check
'use strict';

const { PassThrough } = require('stream');
const { KnexTimeoutError } = require('../../../lib');
const { ResultMapper } = require('../../../lib/query/cast');
const { mockKnex } = require('./mock-client');

const chai = require('chai');
chai.use(/** @type {any} */ (require('chai-as-promised')));
const { expect } = chai;

/** @typedef {import('../../../lib/execution/runner').QueryResult} QueryResult */
/** @typedef {import('../../../types/index').Knex.QueryBuilder} QueryBuilder */

describe('runner', () => {
  describe('run', () => {
    it('emits "error" when ensureConnection fails', async () => {
      const { client, knex } = mockKnex();
      client._nextConnection(new Error('oh noes'));

      /** @type {any} */
      let emitted = undefined;
      const builder = knex.select(1).on(
        'error',
        /** @param {Error} err */ (err) => {
          emitted = err;
        }
      );

      await expect(builder).to.eventually.be.rejectedWith('oh noes');
      expect(emitted).to.be.instanceOf(Error);
      expect(emitted.message).to.match(/oh noes/);
    });
    it('emits "end" when query is complete', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse([]);

      let ended = false;
      const builder = knex.select(1).on('end', () => {
        ended = true;
      });

      await expect(builder).to.eventually.eql([]);
      expect(ended).to.equal(true);
    });
  });

  describe('ensureConnection', () => {
    it('reuses a connection on a builder', async () => {
      const { client, knex } = mockKnex();
      const builder = knex.select(1);

      /** @type {any} */ (builder)._connection = {};
      await builder;
      // MockClient.lastConnection gets set by acquireConnection, which isn't
      // called in this case
      expect(client.lastConnection).to.be.undefined;
    });

    // it.only('reuses a connection on a runner', async () => {
    //   const { client, knex } = mockKnex();
    //   const builder = knex.select(1);
    //   const runner = client.runner(builder);

    //   runner.queryArray([builder.toSQL(), builder.toSQL()]);

    //   const spy = sinon.spy(client, 'acquireConnection');
    //   await knex.schema.alterTable('foo', (tb) => {
    //     tb.check('one');
    //     tb.check('two');
    //   });

    //   sinon.assert.calledOnce(spy);
    //   spy.restore();
    // });

    it('passes through timeout errors', async () => {
      const { client, knex } = mockKnex();
      const err = new KnexTimeoutError();
      client._nextConnection(err);
      const err2 = await expect(knex.select(1)).to.eventually.be.rejected;
      expect(err).to.equal(err2);
    });
  });

  describe('query', () => {
    it('emits "query" when running a query', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse([]);

      /** @type {any} */
      let query = undefined;
      const builder = knex.select(1).on(
        'query',
        /** @param {any} value */ (value) => {
          query = value;
        }
      );

      await expect(builder).to.eventually.eql([]);
      expect(query.sql).to.equal('select 1');
    });
    it('emits "query-error" when a query fails', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse(Promise.reject(new Error('oh noes')));

      /** @type {any} */
      let error = undefined;
      /** @type {any} */
      let data = undefined;
      const builder = knex
        .select(1)
        .queryContext('queryContext')
        .on(
          'query-error',
          /** @param {any} _error @param {any} _data */ (_error, _data) => {
            error = _error;
            data = _data;
          }
        );

      await expect(builder).to.eventually.be.rejected;
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.match(/oh noes/);
      expect(data.queryContext).to.equal('queryContext');
    });
    for (const target of ['client', 'builder']) {
      it('emits "query-response" on builder when a query succeeds', async () => {
        const { client, knex } = mockKnex();
        const response = [{ foo: 'bar' }];
        client._nextResponse(response);

        /** @type {any} */
        let ev_response = undefined;

        /** @type {any} */
        let ev_queryobj = undefined;

        const builder = knex.select(1);

        const callback = /** @param {any} _response @param {any} _query */ (
          _response,
          _query
        ) => {
          ev_response = _response;
          ev_queryobj = _query;
        };

        switch (target) {
          case 'client':
            client.on('query-response', callback);
            break;
          case 'builder':
            builder.on('query-response', callback);
            break;
          default:
            expect.fail(`unhandled target=${target}`);
        }

        await expect(builder).to.eventually.deep.eq(response);
        expect(ev_response).to.equal(response);
        expect(ev_queryobj.response).to.equal(response);
      });
    }
    it('adds query context to the query object', async () => {
      const { knex } = mockKnex();

      /** @type {any} */
      const res = await knex.select(1).queryContext('raw');
      expect(res.queryContext).to.equal('raw');
    });
    it('adds a timeout', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse(new Promise(() => {}));
      await expect(knex.select(1).timeout(1)).to.eventually.be.rejectedWith(
        /timeout/i
      );
    });
    it('cancels query on timeout', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse(new Promise(() => {}));
      await expect(
        knex.select(1).timeout(1, { cancel: true })
      ).to.eventually.be.rejectedWith(/timeout/i);
      expect(client.lastCancelled).to.equal(client.lastConnection);
    });
    it('disposes connection on failed cancel', async () => {
      const { client, knex } = mockKnex();
      const blah = Promise.reject(new Error('oh noes'));
      client._nextCancel(blah);
      blah.catch((e) => {});
      client._nextResponse(new Promise(() => {}));
      await expect(
        knex.select(1).timeout(1, { cancel: true })
      ).to.eventually.be.rejectedWith(/timeout.*cancelling.*failed/);
      expect(client.lastConnection).to.haveOwnProperty('__knex__disposed');
      expect(client.lastConnection.__knex__disposed).to.be.instanceOf(
        KnexTimeoutError
      );
    });
    it('adds context to timeout errors', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse(new Promise(() => {}));

      const err = await expect(
        knex.select(1).timeout(1)
      ).to.eventually.be.rejectedWith(/timeout/i);
      expect(err).to.be.instanceOf(KnexTimeoutError);
      expect(err.sql).to.equal('select 1');
      expect(err.bindings).to.eql([]);
    });
    it('uses query.output if present, instead of processResponse', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse('bad', { output: () => 'good' });
      await expect(knex.select(1)).to.eventually.equal('good');
    });
    it('passes through rejections', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse(Promise.reject('oh noes'));
      await expect(knex.select(1)).to.eventually.be.rejectedWith('oh noes');
    });
    it('passes result and queryContext to postProcessResponse', async () => {
      const { client, knex } = mockKnex({
        /**
         * @param {number} response
         * @param {number} queryContext
         * @returns {number}
         */
        postProcessResponse(response, queryContext) {
          return response * queryContext;
        },
      });

      client._nextResponse(3);
      await expect(knex.select('*').queryContext(7)).to.eventually.equal(21);
    });

    // TODO: assert knexUid / knexTxId

    describe('result casting', () => {
      it('casts result columns (ad-hoc)', async () => {
        const { client, knex } = mockKnex();

        client._nextResponse([{ foo: 1 }, { foo: 1n }]);
        await expect(
          knex.select('foo').cast({ foo: 'bigint' })
        ).to.eventually.deep.eq([{ foo: 1n }, { foo: 1n }]);
      });
      it('casts result columns (prebuilt)', async () => {
        const { client, knex } = mockKnex();
        const mapper = new ResultMapper({ foo: 'bigint' });

        client._nextResponse([{ foo: 1 }, { foo: 1n }]);
        await expect(knex.select('foo').cast(mapper)).to.eventually.deep.eq([
          { foo: 1n },
          { foo: 1n },
        ]);
      });
      it('passes mapped data and queryContext to postProcessResponse', async () => {
        const { client, knex } = mockKnex({
          /**
           * @param {any[]} result
           * @param {bigint} queryContext
           */
          postProcessResponse(result, queryContext) {
            return result.map((v) => ({ foo: v.foo * queryContext }));
          },
        });

        client._nextResponse([{ foo: 1 }, { foo: 2n }]);

        await expect(
          knex.select('foo').queryContext(2n).cast({ foo: 'bigint' })
        ).to.eventually.deep.eq([{ foo: 2n }, { foo: 4n }]);
      });
      it('passes dialect context to resultMapper.applyTo', async () => {
        const { client, knex } = mockKnex();
        client._nextResponse([{ foo: 1 }], { context: { mult: 3 } });
        const mapper = new ResultMapper(
          { foo: 'bigint' },
          (value, cast, ctx) => {
            return cast(value * /** @type {any} */ (ctx).mult);
          }
        );
        await expect(knex.select('*').cast(mapper)).to.eventually.deep.eq([
          { foo: 3n },
        ]);
      });
    });
  });

  describe('queryArray', () => {
    it('runs multiple queries', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse({ foo: 1 });
      client._nextResponse({ foo: 1 });

      const res = await client._runMultiple([knex.select(1), knex.select(1)]);

      expect(res).to.deep.eq([{ foo: 1 }, { foo: 1 }]);
    });

    // sqlite abstraction leaked into base Runner class; this whole chunk of code
    // is relevant only to sqlite3 schema builder and encodes certain assumptions
    // about sqlite3-specific necessities
    describe('statementsProducer', () => {
      it('runs pre, rejects with result', async () => {
        const { client } = mockKnex();
        client._matchResponse('pre', Promise.reject(new Error('pre')));

        await expect(
          client._runProducer(['pre'], ['actual'], ['post'], 'check')
        ).to.eventually.be.rejectedWith(/pre/);
      });
      it('runs post, rejects with result', async () => {
        const { client } = mockKnex();
        client._matchResponse('post', Promise.reject(new Error('post')));

        await expect(
          client._runProducer(['pre'], ['actual'], ['post'], 'check')
        ).to.eventually.be.rejectedWith(/post/);
      });
      it('runs check, rejects with foreign key violations', async () => {
        const { client } = mockKnex();
        client._matchResponse('post', { foreignViolations: 1 });

        await expect(
          client._runProducer(['pre'], ['actual'], ['post'], 'check')
        ).to.eventually.be.rejectedWith(/FOREIGN KEY/);
      });
      it('runs check, passes without foreign key violations', async () => {
        const { client } = mockKnex();

        client._matchResponse('actual', { foo: 1 });
        client._matchResponse('check', { foreignViolations: 0 });

        const res = await client._runProducer(
          ['pre'],
          ['actual'],
          ['post'],
          'check'
        );
        expect(res).to.deep.eq({ foo: 1 });
      });
      it('returns result of actual sql', async () => {
        const { client } = mockKnex();
        client._matchResponse('actual', { foo: 1 });

        const res = await client._runProducer(
          ['pre'],
          ['actual'],
          ['post'],
          ''
        );

        expect(res).to.deep.eq({ foo: 1 });
      });
      it('returns result of actual sql (with check)', async () => {
        const { client } = mockKnex();
        client._matchResponse('actual', { foo: 1 });
        client._matchResponse('check', { foreignViolations: 0 });

        const res = await client._runProducer(
          ['pre'],
          ['actual'],
          ['post'],
          'check'
        );

        expect(res).to.deep.eq({ foo: 1 });
      });
    });
  });

  describe('stream', async () => {
    it('streams rows', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse({ foo: 1 });

      const rows = [];
      const stream = knex.select(1).stream();
      for await (const row of stream) {
        rows.push(row);
      }

      expect(rows).to.deep.eq([{ foo: 1 }]);
    });

    it('streams rows with a handler', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse({ foo: 1 });

      await knex.select(1).stream(async (stream) => {
        const rows = [];
        for await (const row of stream) {
          rows.push(row);
        }
        expect(rows).to.deep.eq([{ foo: 1 }]);
      });
    });

    it('maps streamed rows with .cast()', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse({ foo: 1 });

      const rows = [];
      const stream = knex.select(1).cast({ foo: 'bigint' }).stream();
      for await (const row of stream) {
        rows.push(row);
      }

      expect(rows).to.deep.eq([{ foo: 1n }]);
    });

    it('passes dialect context to resultMapper.applyTo', async () => {
      const { client, knex } = mockKnex();
      client._nextResponse([{ foo: 1 }]);
      const mapper = new ResultMapper({ foo: 'bigint' }, (value, cast, ctx) => {
        return cast(value * /** @type {any} */ (ctx).mult);
      });

      const rows = [];
      const stream = knex.select('*').cast(mapper).stream();
      /** @type {any} */ (stream).setContext({ mult: 3 });

      for await (const row of stream) {
        rows.push(row);
      }
    });

    describe('pipe()', () => {
      it("pipes rows through the runner's transform stream", async () => {
        const { client, knex } = mockKnex();
        client._nextResponse({ foo: 1 });

        /** @type {any[]} */
        const rows = [];
        const dest = new PassThrough({
          // call this out in docs??
          // why did nothing happen if not in object mode, that's surprising
          objectMode: true,
        });

        knex.select(1).pipe(dest);
        for await (const row of dest) {
          rows.push(row);
        }

        expect(rows).to.deep.eq([{ foo: 1 }]);
      });

      it('passes result and queryContext to postProcessResponse', async () => {
        const { client, knex } = mockKnex({
          /**
           * @param {number} response
           * @param {number} queryContext
           * @returns {number}
           */
          postProcessResponse(response, queryContext) {
            return response * queryContext;
          },
        });

        client._nextResponse(3);

        /** @type {any[]} */
        const rows = [];
        const dest = new PassThrough({
          // call this out in docs??
          // why did nothing happen if not in object mode, that's surprising
          objectMode: true,
        });

        knex.select(1).queryContext(7).pipe(dest);
        for await (const row of dest) {
          rows.push(row);
        }

        expect(rows).to.deep.eq([21]);
      });

      it('closes a piped stream when already closed', async () => {
        const { client, knex } = mockKnex();
        client._nextConnection(new Error('oh noes'));

        // not fully sure what scenario this happens in, it is
        // probably a fix for some issue at some point
        const stream = knex.select(1).stream();
        stream.destroy();
        const pt = new PassThrough();
        pt.pipe(stream);

        await new Promise((resolve, reject) => {
          pt.on('close', () => resolve(null));
          // close events happen via nextTick, so
          // we have to wait a bit before knowing
          // it _didn't_ get fired
          setTimeout(() => reject(new Error('expected close event')), 100);
        });
      });
    });

    it('throws on invalid pipe', async () => {
      const { knex } = mockKnex();

      expect(() => {
        knex.select(1).pipe(new PassThrough());
      }).to.throw(/must be objectMode: true/);
    });

    // TODO: i have no idea how to exercise runner.js line ~ 140 catch block

    // it('emits connection errors (exactly once)', async () => {
    //   const { client, knex } = mockKnex();
    //   client._nextConnection(new Error('oh noes'));

    //   const promise = new Promise((resolve, reject) => {
    //     const stream = knex.select(1).stream();

    //     let count = 0;

    //     stream.on('error', (err) => {
    //       count++;
    //       expect(err.message).to.match(/oh noes/);
    //     });
    //     stream.on('end', () => {
    //       resolve(count);
    //     });
    //     stream.resume();
    //   });
    //   await expect(promise).to.eventually.equal(1);
    // });

    // it.only('emits other errors (exactly once)', async () => {
    //   const { client, knex } = mockKnex();

    //   let count = 0;
    //   await knex.select(1).stream((stream) => {
    //     stream.on('error', () => {
    //       count++;
    //     });
    //     throw new Error('oh noes');
    //   });

    //   expect(count).to.equal(1);
    // });
  });
});
