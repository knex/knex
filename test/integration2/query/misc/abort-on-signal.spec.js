const { expect } = require('chai');

module.exports = function (knex) {
  describe('abortOnSignal Integration Tests', function () {
    before(function () {
      // Skip these tests if the client doesn't support query cancellation
      if (!knex.client.canCancelQuery) {
        this.skip();
      }
    });

    it('should abort a query using AbortController', async function () {
      const controller = new AbortController();

      // Start a long-running query that we can abort
      const queryPromise = knex
        .raw('SELECT 1 as test') // Simple query that should succeed if not aborted
        .abortOnSignal(controller.signal);

      // Abort immediately
      controller.abort();

      // The query should be rejected with an AbortError
      await expect(queryPromise).to.be.rejectedWith('Query was aborted');

      try {
        await queryPromise;
      } catch (error) {
        expect(error.name).to.equal('AbortError');
        expect(error.code).to.equal('ABORT_ERR');
      }
    });

    it('should not affect query if not aborted', async function () {
      const controller = new AbortController();

      // Start a simple query
      const queryPromise = knex
        .raw('SELECT 1 as test')
        .abortOnSignal(controller.signal);

      // Don't abort the signal
      const result = await queryPromise;

      // The query should succeed normally
      expect(result).to.be.an('array');
      // Result structure varies by database, but should contain our test data
    });

    it('should work with query builder', async function () {
      const controller = new AbortController();

      // For this test we need to have a test table. Let's use a simple select that works everywhere
      const queryPromise = knex
        .select(knex.raw('1 as test'))
        .abortOnSignal(controller.signal);

      // Abort immediately
      controller.abort();

      // The query should be rejected with an AbortError
      await expect(queryPromise).to.be.rejectedWith('Query was aborted');
    });

    it('should work with both timeout and abortSignal', async function () {
      const controller = new AbortController();

      const queryPromise = knex
        .raw('SELECT 1 as test')
        .timeout(5000, { cancel: true })
        .abortOnSignal(controller.signal);

      // Abort immediately (should abort before timeout)
      controller.abort();

      // The query should be rejected with an AbortError
      await expect(queryPromise).to.be.rejectedWith('Query was aborted');
    });

    it('should handle already aborted signal during setup', function () {
      const controller = new AbortController();
      controller.abort();

      expect(() => {
        knex.raw('SELECT 1').abortOnSignal(controller.signal);
      }).to.throw('Signal is already aborted');
    });

    it('should handle invalid signal parameter', function () {
      expect(() => {
        knex.raw('SELECT 1').abortOnSignal('not a signal');
      }).to.throw('Expected signal to be an instance of AbortSignal');
    });
  });
};