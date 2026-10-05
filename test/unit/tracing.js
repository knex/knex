'use strict';

const { expect } = require('chai');

let dc;
try {
  dc =
    'getBuiltinModule' in process
      ? process.getBuiltinModule('node:diagnostics_channel')
      : require('node:diagnostics_channel');
} catch {
  dc = undefined;
}

const hasTracingChannel = typeof (dc && dc.tracingChannel) === 'function';

(hasTracingChannel ? describe : describe.skip)(
  'TracingChannel support',
  function () {
    this.timeout(process.env.KNEX_TEST_TIMEOUT || 10000);

    let knex;

    before(function () {
      knex = require('../../lib/index')({
        client: 'better-sqlite3',
        connection: {
          filename: ':memory:',
        },
        useNullAsDefault: true,
        pool: { min: 0, max: 2 },
      });

      return knex.schema.createTable('test_tracing', (table) => {
        table.increments('id');
        table.string('name');
      });
    });

    after(function () {
      return knex.destroy();
    });

    describe('knex:query channel', function () {
      let queryChannel;

      before(function () {
        queryChannel = dc.tracingChannel('knex:query');
      });

      it('emits start and asyncEnd for a select query', async function () {
        const events = [];

        const handlers = {
          start(ctx) {
            events.push({ event: 'start', ...ctx });
          },
          end(ctx) {
            events.push({ event: 'end' });
          },
          asyncStart(ctx) {
            events.push({ event: 'asyncStart' });
          },
          asyncEnd(ctx) {
            events.push({ event: 'asyncEnd' });
          },
          error(ctx) {
            events.push({ event: 'error', error: ctx.error });
          },
        };

        queryChannel.subscribe(handlers);
        try {
          await knex('test_tracing').select('*');

          expect(events.length).to.be.greaterThan(0);
          const startEvent = events.find((e) => e.event === 'start');
          expect(startEvent).to.exist;
          expect(startEvent.query).to.be.a('string');
          expect(startEvent.query).to.match(/select/i);
          expect(startEvent.method).to.equal('select');
          expect(startEvent.table).to.equal('test_tracing');
        } finally {
          queryChannel.unsubscribe(handlers);
        }
      });

      it('emits start for an insert query with correct method', async function () {
        const events = [];

        const handlers = {
          start(ctx) {
            events.push({ event: 'start', ...ctx });
          },
          end() {},
          asyncStart() {},
          asyncEnd() {},
          error() {},
        };

        queryChannel.subscribe(handlers);
        try {
          await knex('test_tracing').insert({ name: 'test' });

          const startEvent = events.find((e) => e.event === 'start');
          expect(startEvent).to.exist;
          expect(startEvent.method).to.equal('insert');
          expect(startEvent.table).to.equal('test_tracing');
          expect(startEvent.bindings).to.be.an('array');
        } finally {
          queryChannel.unsubscribe(handlers);
        }
      });

      it('emits error event on query failure', async function () {
        const events = [];

        const handlers = {
          start(ctx) {
            events.push({ event: 'start' });
          },
          end() {},
          asyncStart() {},
          asyncEnd() {},
          error(ctx) {
            events.push({ event: 'error', error: ctx.error });
          },
        };

        queryChannel.subscribe(handlers);
        try {
          await knex('nonexistent_table')
            .select('*')
            .catch(() => {});

          const errorEvent = events.find((e) => e.event === 'error');
          expect(errorEvent).to.exist;
          expect(errorEvent.error).to.be.an.instanceOf(Error);
        } finally {
          queryChannel.unsubscribe(handlers);
        }
      });
    });

    describe('knex:transaction channel', function () {
      let transactionChannel;

      before(function () {
        transactionChannel = dc.tracingChannel('knex:transaction');
      });

      it('emits start and asyncEnd for a successful transaction', async function () {
        const events = [];

        const handlers = {
          start(ctx) {
            events.push({
              event: 'start',
              transactionId: ctx.transactionId,
            });
          },
          end() {},
          asyncStart() {},
          asyncEnd(ctx) {
            events.push({ event: 'asyncEnd' });
          },
          error() {},
        };

        transactionChannel.subscribe(handlers);
        try {
          await knex.transaction(async (trx) => {
            await trx('test_tracing').insert({ name: 'trx_test' });
          });

          const startEvent = events.find((e) => e.event === 'start');
          expect(startEvent).to.exist;
          expect(startEvent.transactionId).to.be.a('string');
          expect(startEvent.transactionId).to.match(/^trx/);

          const asyncEndEvent = events.find((e) => e.event === 'asyncEnd');
          expect(asyncEndEvent).to.exist;
        } finally {
          transactionChannel.unsubscribe(handlers);
        }
      });

      it('emits error on transaction rollback', async function () {
        const events = [];

        const handlers = {
          start(ctx) {
            events.push({ event: 'start' });
          },
          end() {},
          asyncStart() {},
          asyncEnd() {},
          error(ctx) {
            events.push({ event: 'error', error: ctx.error });
          },
        };

        transactionChannel.subscribe(handlers);
        try {
          await knex
            .transaction(async (trx) => {
              throw new Error('deliberate rollback');
            })
            .catch(() => {});

          const errorEvent = events.find((e) => e.event === 'error');
          expect(errorEvent).to.exist;
        } finally {
          transactionChannel.unsubscribe(handlers);
        }
      });
    });

    describe('knex:pool:acquire channel', function () {
      let poolAcquireChannel;

      before(function () {
        poolAcquireChannel = dc.tracingChannel('knex:pool:acquire');
      });

      it('emits start and asyncEnd when acquiring a connection', async function () {
        const events = [];

        const handlers = {
          start(ctx) {
            events.push({ event: 'start', ...ctx });
          },
          end() {},
          asyncStart() {},
          asyncEnd(ctx) {
            events.push({ event: 'asyncEnd' });
          },
          error() {},
        };

        poolAcquireChannel.subscribe(handlers);
        try {
          await knex('test_tracing').select('*');

          const startEvent = events.find((e) => e.event === 'start');
          expect(startEvent).to.exist;

          const asyncEndEvent = events.find((e) => e.event === 'asyncEnd');
          expect(asyncEndEvent).to.exist;
        } finally {
          poolAcquireChannel.unsubscribe(handlers);
        }
      });
    });

    describe('knex:pool:release channel', function () {
      it('publishes when a connection is released', async function () {
        const events = [];
        const releaseChannel = dc.channel('knex:pool:release');

        const handler = (ctx) => {
          events.push(ctx);
        };

        releaseChannel.subscribe(handler);
        try {
          await knex('test_tracing').select('*');

          expect(events.length).to.be.greaterThan(0);
          // The context should contain connection info fields
          expect(events[0]).to.have.property('database');
        } finally {
          releaseChannel.unsubscribe(handler);
        }
      });
    });

    describe('no subscribers', function () {
      it('works without errors when no subscribers are attached', async function () {
        const result = await knex('test_tracing').select('*');
        expect(result).to.be.an('array');
      });
    });
  }
);
