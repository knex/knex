const { expect } = require('chai');
const sinon = require('sinon');
const Knex = require('../../../lib/index');
const Client = require('../../../lib/client');
const { KnexPool, isTarnPool } = require('../../../lib/pool');
const { Pool } = require('tarn');

// Minimal test client with a driverName so constructor paths are exercised
class TestClient extends Client {
  constructor(config = {}) {
    super({ ...config, client: 'test' });
  }
}
TestClient.prototype.driverName = 'test';
TestClient.prototype.dialect = 'test';
TestClient.prototype._driver = function () {
  return {};
};
TestClient.prototype.initializeDriver = function () {
  this.driver = {};
};

describe('connectionPool config option', () => {
  afterEach(() => {
    sinon.restore();
  });

  // ── Config validation ──────────────────────────────────────────────

  describe('config validation', () => {
    it('throws when both connection and connectionPool are provided', () => {
      expect(() => {
        Knex({
          client: 'pg',
          connection: { host: 'localhost' },
          connectionPool: { connect: () => {} },
        });
      }).to.throw(/connectionPool.*connection.*mutually exclusive/i);
    });

    it('accepts connectionPool without connection', () => {
      const mockPool = { connect: () => Promise.resolve({}) };
      expect(() => {
        const knex = Knex({ client: 'pg', connectionPool: mockPool });
        knex.destroy();
      }).not.to.throw();
    });
  });

  // ── KnexPool class ────────────────────────────────────────────────

  describe('KnexPool', () => {
    it('is exported on the knex namespace', () => {
      expect(Knex.KnexPool).to.equal(KnexPool);
    });

    it('extends tarn Pool', () => {
      expect(KnexPool.prototype).to.be.instanceOf(Pool);
    });
  });

  // ── isTarnPool detection ──────────────────────────────────────────

  describe('isTarnPool', () => {
    it('returns true for a KnexPool instance', () => {
      const pool = new KnexPool({
        create: () => Promise.resolve({}),
        destroy: () => Promise.resolve(),
        min: 0,
        max: 1,
      });
      expect(isTarnPool(pool)).to.be.true;
      pool.destroy();
    });

    it('returns true for a tarn Pool instance', () => {
      const pool = new Pool({
        create: () => Promise.resolve({}),
        destroy: () => Promise.resolve(),
        min: 0,
        max: 1,
      });
      expect(isTarnPool(pool)).to.be.true;
      pool.destroy();
    });

    it('returns false for a pg-like native pool', () => {
      expect(
        isTarnPool({
          connect: () => Promise.resolve({}),
          end: () => Promise.resolve(),
          totalCount: 0,
          idleCount: 0,
        })
      ).to.be.false;
    });

    it('returns false for a mysql-like native pool', () => {
      expect(
        isTarnPool({
          getConnection: (cb) => cb(null, {}),
          end: (cb) => cb(),
        })
      ).to.be.false;
    });
  });

  // ── Base Client ───────────────────────────────────────────────────

  describe('base Client', () => {
    it('wrapNativePool throws for unsupported dialects', () => {
      expect(() => {
        new TestClient({ connectionPool: {} });
      }).to.throw(/does not support native driver pools/);
    });

    it('uses tarn pool directly when connectionPool is tarn-compatible', () => {
      const tarnPool = new Pool({
        create: () => Promise.resolve({}),
        destroy: () => Promise.resolve(),
        min: 0,
        max: 1,
      });

      const client = new TestClient();
      client.initializeExternalPool(tarnPool);

      expect(client.pool).to.equal(tarnPool);
      expect(client._ownsPool).to.be.false;
      tarnPool.destroy();
    });
  });

  // ── Destroy behavior ──────────────────────────────────────────────

  describe('destroy behavior', () => {
    it('does NOT call pool.destroy when _ownsPool is false', async () => {
      const client = new TestClient();
      const destroySpy = sinon.spy(() => Promise.resolve());
      client.pool = { destroy: destroySpy };
      client._ownsPool = false;

      await client.destroy();

      expect(destroySpy.called).to.be.false;
      expect(client.pool).to.be.undefined;
    });

    it('calls pool.destroy when _ownsPool is true', async () => {
      const client = new TestClient();
      const destroySpy = sinon.spy(() => Promise.resolve());
      client.pool = { destroy: destroySpy };
      client._ownsPool = true;

      await client.destroy();

      expect(destroySpy.calledOnce).to.be.true;
      expect(client.pool).to.be.undefined;
    });

    it('calls pool.destroy when _ownsPool is undefined (backwards compat)', async () => {
      const client = new TestClient();
      const destroySpy = sinon.spy(() => Promise.resolve());
      client.pool = { destroy: destroySpy };
      // _ownsPool not set — legacy path, should still destroy

      await client.destroy();

      expect(destroySpy.calledOnce).to.be.true;
    });
  });

  // ── PostgreSQL adapter ────────────────────────────────────────────

  describe('PostgreSQL wrapNativePool', () => {
    let PgClient;

    before(() => {
      try {
        PgClient = require('../../../lib/dialects/postgres/index');
      } catch (_e) {
        // pg may not be installed
      }
    });

    it('acquire calls nativePool.connect and assigns __knexUid', async function () {
      if (!PgClient) this.skip();

      const mockConnection = { query: sinon.stub() };
      const mockPool = { connect: sinon.stub().resolves(mockConnection) };

      const client = Object.create(PgClient.prototype);
      client.version = '14.0';
      const adapter = client.wrapNativePool(mockPool);

      const connection = await adapter.acquire().promise;
      expect(mockPool.connect.calledOnce).to.be.true;
      expect(connection.__knexUid).to.be.a('string');
      expect(connection).to.equal(mockConnection);
    });

    it('release(false) for healthy connections', function () {
      if (!PgClient) this.skip();

      const conn = { release: sinon.stub() };
      const client = Object.create(PgClient.prototype);
      client.version = '14.0';
      const adapter = client.wrapNativePool({});

      expect(adapter.release(conn)).to.be.true;
      expect(conn.release.calledWith(false)).to.be.true;
    });

    it('release(true) for disposed connections', function () {
      if (!PgClient) this.skip();

      const conn = { release: sinon.stub(), __knex__disposed: 'err' };
      const client = Object.create(PgClient.prototype);
      client.version = '14.0';
      const adapter = client.wrapNativePool({});

      expect(adapter.release(conn)).to.be.true;
      expect(conn.release.calledWith(true)).to.be.true;
    });
  });

  // ── MySQL adapter ─────────────────────────────────────────────────

  describe('MySQL wrapNativePool', () => {
    let MySQLClient;

    before(() => {
      try {
        MySQLClient = require('../../../lib/dialects/mysql/index');
      } catch (_e) {
        // mysql may not be installed
      }
    });

    it('acquire calls nativePool.getConnection', async function () {
      if (!MySQLClient) this.skip();

      const mockConn = {};
      const mockPool = {
        getConnection: sinon.stub().callsFake((cb) => cb(null, mockConn)),
      };

      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool(mockPool);
      const conn = await adapter.acquire().promise;

      expect(conn.__knexUid).to.be.a('string');
      expect(conn).to.equal(mockConn);
    });

    it('release calls connection.release for healthy connections', function () {
      if (!MySQLClient) this.skip();

      const conn = { release: sinon.stub() };
      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool({});

      expect(adapter.release(conn)).to.be.true;
      expect(conn.release.calledOnce).to.be.true;
    });

    it('release calls connection.destroy for disposed connections', function () {
      if (!MySQLClient) this.skip();

      const conn = {
        release: sinon.stub(),
        destroy: sinon.stub(),
        __knex__disposed: 'err',
      };
      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool({});

      expect(adapter.release(conn)).to.be.true;
      expect(conn.destroy.calledOnce).to.be.true;
      expect(conn.release.called).to.be.false;
    });
  });
});
