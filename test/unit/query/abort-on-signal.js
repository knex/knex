const expect = require('chai').expect;
const Client = require('../../../lib/client');
const QueryBuilder = require('../../../lib/query/querybuilder');
const Raw = require('../../../lib/raw');

describe('AbortSignal functionality', function () {
  let client;

  beforeEach(function () {
    client = new Client({ client: 'sqlite3' });
    client.canCancelQuery = true; // Mock cancellation support
  });

  describe('QueryBuilder.abortOnSignal', function () {
    it('should add abortOnSignal method to QueryBuilder', function () {
      const qb = new QueryBuilder(client);
      expect(qb.abortOnSignal).to.be.a('function');
    });

    it('should throw error if AbortSignal not available', function () {
      const qb = new QueryBuilder(client);
      const originalAbortSignal = global.AbortSignal;
      delete global.AbortSignal;

      try {
        expect(() => {
          qb.abortOnSignal({});
        }).to.throw('AbortSignal is not available. Node.js 15 or higher is required.');
      } finally {
        global.AbortSignal = originalAbortSignal;
      }
    });

    it('should throw error if signal is not an AbortSignal instance', function () {
      const qb = new QueryBuilder(client);
      expect(() => {
        qb.abortOnSignal({});
      }).to.throw('Expected signal to be an instance of AbortSignal');
    });

    it('should throw error if signal is already aborted', function () {
      const qb = new QueryBuilder(client);
      const controller = new AbortController();
      controller.abort();

      expect(() => {
        qb.abortOnSignal(controller.signal);
      }).to.throw('Signal is already aborted');
    });

    it('should throw error if client cannot cancel queries', function () {
      const nonCancelClient = new Client({ client: 'sqlite3' });
      nonCancelClient.canCancelQuery = false;
      const qb = new QueryBuilder(nonCancelClient);
      const controller = new AbortController();

      expect(() => {
        qb.abortOnSignal(controller.signal);
      }).to.throw('Query cancelling not supported for this dialect');
    });

    it('should accept a valid AbortSignal and return this', function () {
      const qb = new QueryBuilder(client);
      const controller = new AbortController();

      const result = qb.abortOnSignal(controller.signal);
      expect(result).to.equal(qb);
      expect(qb._abortSignal).to.equal(controller.signal);
    });

    it('should include abortSignal in compiled query', function () {
      const qb = new QueryBuilder(client);
      const controller = new AbortController();

      qb.select('*').from('users').abortOnSignal(controller.signal);
      const compiled = qb.toSQL();

      expect(compiled.abortSignal).to.equal(controller.signal);
    });

    it('should work with timeout simultaneously', function () {
      const qb = new QueryBuilder(client);
      const controller = new AbortController();

      qb.select('*')
        .from('users')
        .timeout(5000, { cancel: true })
        .abortOnSignal(controller.signal);

      const compiled = qb.toSQL();

      expect(compiled.timeout).to.equal(5000);
      expect(compiled.cancelOnTimeout).to.equal(true);
      expect(compiled.abortSignal).to.equal(controller.signal);
    });
  });

  describe('Raw.abortOnSignal', function () {
    it('should add abortOnSignal method to Raw', function () {
      const raw = new Raw(client);
      expect(raw.abortOnSignal).to.be.a('function');
    });

    it('should throw error if signal is not an AbortSignal instance', function () {
      const raw = new Raw(client);
      expect(() => {
        raw.abortOnSignal({});
      }).to.throw('Expected signal to be an instance of AbortSignal');
    });

    it('should throw error if signal is already aborted', function () {
      const raw = new Raw(client);
      const controller = new AbortController();
      controller.abort();

      expect(() => {
        raw.abortOnSignal(controller.signal);
      }).to.throw('Signal is already aborted');
    });

    it('should accept a valid AbortSignal and return this', function () {
      const raw = new Raw(client);
      const controller = new AbortController();

      const result = raw.abortOnSignal(controller.signal);
      expect(result).to.equal(raw);
      expect(raw._abortSignal).to.equal(controller.signal);
    });

    it('should include abortSignal in compiled query', function () {
      const raw = new Raw(client);
      const controller = new AbortController();

      raw.set('SELECT * FROM users').abortOnSignal(controller.signal);
      const compiled = raw.toSQL();

      expect(compiled.abortSignal).to.equal(controller.signal);
    });

    it('should work with timeout simultaneously', function () {
      const raw = new Raw(client);
      const controller = new AbortController();

      raw
        .set('SELECT * FROM users')
        .timeout(5000, { cancel: true })
        .abortOnSignal(controller.signal);

      const compiled = raw.toSQL();

      expect(compiled.timeout).to.equal(5000);
      expect(compiled.cancelOnTimeout).to.equal(true);
      expect(compiled.abortSignal).to.equal(controller.signal);
    });
  });
});