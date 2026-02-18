const Knex = require('../../lib/index');
const { expect } = require('chai');
const sqliteConfig = require('../knexfile').sqlite3;
const sqlite3 = require('sqlite3');
const sinon = require('sinon');

describe('hooks', () => {
  let connection;
  beforeEach(() => {
    connection = new sqlite3.Database(':memory:');
  });

  afterEach(() => {
    connection.close();
  });

  describe('register', () => {
    it('throws if the hook type is unknown', () => {
      const knex = Knex({ client: 'sqlite3', useNullAsDefault: true });
      expect(() => {
        knex.client.hooks.register('unknownHook', () => {});
      }).to.throw('Unknown hook type: unknownHook');
    });
  });

  describe('beforeAcquire', () => {
    it('is called before acquiring a connection from the pool', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const beforeAcquireHook = sinon.spy();
      knex.hooks.register('beforeAcquire', beforeAcquireHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      expect(beforeAcquireHook.calledOnce).to.be.true;
      expect(beforeAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeAcquireHook.args[0][0].queryContext).to.equal(queryContext);
      expect(beforeAcquireHook.calledBefore(acquireConnectionSpy)).to.be.true;
    });

    it('is called before acquiring a connection from the pool while using a transaction', async () => {
      const userParams = { user_id: 1 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const beforeAcquireHook = sinon.spy();
      knex.hooks.register('beforeAcquire', beforeAcquireHook);
      const queryContext = { user_id: 2 };
      const txnContext = { user_id: 3 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      expect(beforeAcquireHook.calledOnce).to.be.true;
      expect(beforeAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeAcquireHook.args[0][0].txnContext).to.equal(txnContext);
      expect(beforeAcquireHook.calledBefore(acquireConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams clone', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const beforeAcquireHook = sinon.spy();
      knex.hooks.register('beforeAcquire', beforeAcquireHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      expect(beforeAcquireHook.calledOnce).to.be.true;
      expect(beforeAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeAcquireHook.args[0][0].queryContext).to.equal(queryContext);
      expect(beforeAcquireHook.calledBefore(acquireConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams clone while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const beforeAcquireHook = sinon.spy();
      knex.hooks.register('beforeAcquire', beforeAcquireHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      expect(beforeAcquireHook.calledOnce).to.be.true;
      expect(beforeAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeAcquireHook.args[0][0].txnContext).to.equal(txnContext);
      expect(beforeAcquireHook.calledBefore(acquireConnectionSpy)).to.be.true;
    });
  });

  describe('afterAcquire', () => {
    it('is called after acquiring a connection from the pool', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const afterAcquireHook = sinon.spy();
      knex.hooks.register('afterAcquire', afterAcquireHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      const connection = await acquireConnectionSpy.returnValues[0].promise;
      expect(afterAcquireHook.calledOnce).to.be.true;
      expect(afterAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(afterAcquireHook.args[0][0].queryContext).to.equal(queryContext);
      expect(afterAcquireHook.args[0][1]).to.equal(connection);
      expect(afterAcquireHook.calledAfter(acquireConnectionSpy)).to.be.true;
    });

    it('is called after acquiring a connection from the pool while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const afterAcquireHook = sinon.spy();
      knex.hooks.register('afterAcquire', afterAcquireHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      const connection = await acquireConnectionSpy.returnValues[0].promise;
      expect(afterAcquireHook.calledOnce).to.be.true;
      expect(afterAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(afterAcquireHook.args[0][0].txnContext).to.equal(txnContext);
      expect(afterAcquireHook.args[0][1]).to.equal(connection);
      expect(afterAcquireHook.calledAfter(acquireConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const afterAcquireHook = sinon.spy();
      knex.hooks.register('afterAcquire', afterAcquireHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      const connection = await acquireConnectionSpy.returnValues[0].promise;
      expect(afterAcquireHook.calledOnce).to.be.true;
      expect(afterAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(afterAcquireHook.args[0][0].queryContext).to.equal(queryContext);
      expect(afterAcquireHook.args[0][1]).to.equal(connection);
      expect(afterAcquireHook.calledAfter(acquireConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams clone while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const acquireConnectionSpy = sinon.spy(knex.client.pool, 'acquire');
      const afterAcquireHook = sinon.spy();
      knex.hooks.register('afterAcquire', afterAcquireHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      const connection = await acquireConnectionSpy.returnValues[0].promise;
      expect(afterAcquireHook.calledOnce).to.be.true;
      expect(afterAcquireHook.args[0][0].userParams).to.equal(userParams);
      expect(afterAcquireHook.args[0][0].txnContext).to.equal(txnContext);
      expect(afterAcquireHook.args[0][1]).to.equal(connection);
      expect(afterAcquireHook.calledAfter(acquireConnectionSpy)).to.be.true;
    });
  });

  describe('beforeRelease', () => {
    it('is called before releasing a connection back to the pool', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const beforeReleaseHook = sinon.spy();
      knex.hooks.register('beforeRelease', beforeReleaseHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      const connection = releaseConnectionSpy.args[0][0];
      expect(beforeReleaseHook.calledOnce).to.be.true;
      expect(beforeReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeReleaseHook.args[0][0].queryContext).to.equal(queryContext);
      expect(beforeReleaseHook.args[0][1]).to.equal(connection);
      expect(beforeReleaseHook.calledBefore(releaseConnectionSpy)).to.be.true;
    });

    it('is called before releasing a connection back to the pool while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const beforeReleaseHook = sinon.spy();
      knex.hooks.register('beforeRelease', beforeReleaseHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      const connection = releaseConnectionSpy.args[0][0];
      expect(beforeReleaseHook.calledOnce).to.be.true;
      expect(beforeReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeReleaseHook.args[0][0].txnContext).to.equal(txnContext);
      expect(beforeReleaseHook.args[0][1]).to.equal(connection);
      expect(beforeReleaseHook.calledBefore(releaseConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const beforeReleaseHook = sinon.spy();
      knex.hooks.register('beforeRelease', beforeReleaseHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      const connection = releaseConnectionSpy.args[0][0];
      expect(beforeReleaseHook.calledOnce).to.be.true;
      expect(beforeReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeReleaseHook.args[0][0].queryContext).to.equal(queryContext);
      expect(beforeReleaseHook.args[0][1]).to.equal(connection);
      expect(beforeReleaseHook.calledBefore(releaseConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams clone while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const beforeReleaseHook = sinon.spy();
      knex.hooks.register('beforeRelease', beforeReleaseHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      const connection = releaseConnectionSpy.args[0][0];
      expect(beforeReleaseHook.calledOnce).to.be.true;
      expect(beforeReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(beforeReleaseHook.args[0][0].txnContext).to.equal(txnContext);
      expect(beforeReleaseHook.args[0][1]).to.equal(connection);
      expect(beforeReleaseHook.calledBefore(releaseConnectionSpy)).to.be.true;
    });
  });

  describe('afterRelease', () => {
    it('is called after releasing a connection back to the pool', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const afterReleaseHook = sinon.spy();
      knex.hooks.register('afterRelease', afterReleaseHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      expect(afterReleaseHook.calledOnce).to.be.true;
      expect(afterReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(afterReleaseHook.args[0][0].queryContext).to.equal(queryContext);
      expect(afterReleaseHook.calledAfter(releaseConnectionSpy)).to.be.true;
    });

    it('is called after releasing a connection back to the pool while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
        userParams,
      });
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const afterReleaseHook = sinon.spy();
      knex.hooks.register('afterRelease', afterReleaseHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      expect(afterReleaseHook.calledOnce).to.be.true;
      expect(afterReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(afterReleaseHook.args[0][0].txnContext).to.equal(txnContext);
      expect(afterReleaseHook.calledAfter(releaseConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const afterReleaseHook = sinon.spy();
      knex.hooks.register('afterRelease', afterReleaseHook);
      const queryContext = { user_id: 123 };
      await knex.select(knex.raw('1+1 as result')).queryContext(queryContext);
      expect(afterReleaseHook.calledOnce).to.be.true;
      expect(afterReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(afterReleaseHook.args[0][0].queryContext).to.equal(queryContext);
      expect(afterReleaseHook.calledAfter(releaseConnectionSpy)).to.be.true;
    });

    it('is called from withUserParams clone while using a transaction', async () => {
      const userParams = { user_id: 123 };
      const knex = Knex({
        ...sqliteConfig,
        useNullAsDefault: true,
      }).withUserParams(userParams);
      const releaseConnectionSpy = sinon.spy(knex.client.pool, 'release');
      const afterReleaseHook = sinon.spy();
      knex.hooks.register('afterRelease', afterReleaseHook);
      const queryContext = { user_id: 123 };
      const txnContext = { user_id: 123 };
      await knex.transaction(
        async (trx) => {
          await trx.select(trx.raw('1+1 as result')).queryContext(queryContext);
        },
        { txnContext }
      );
      expect(afterReleaseHook.calledOnce).to.be.true;
      expect(afterReleaseHook.args[0][0].userParams).to.equal(userParams);
      expect(afterReleaseHook.args[0][0].txnContext).to.equal(txnContext);
      expect(afterReleaseHook.calledAfter(releaseConnectionSpy)).to.be.true;
    });
  });
});
