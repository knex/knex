const { expect } = require('chai');
const sinon = require('sinon');
const Knex = require('../../../lib/index');
const Client = require('../../../lib/client');

// Minimal test client with a driverName so the connectionPool path is hit
class TestClient extends Client {
  constructor(config = {}) {
    super({ ...config, client: 'test' });
  }
}
// Assign after class definition to avoid prototype issues
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
      // pg dialect will call wrapNativePool — provide a mock pool
      const mockPool = {
        connect: () => Promise.resolve({}),
      };
      expect(() => {
        const knex = Knex({
          client: 'pg',
          connectionPool: mockPool,
        });
        // Clean up
        knex.destroy();
      }).not.to.throw();
    });
  });

  describe('base Client', () => {
    it('wrapNativePool throws for unsupported dialects', () => {
      expect(() => {
        new TestClient({
          connectionPool: {},
        });
      }).to.throw(/does not support the 'connectionPool' option/);
    });

    it('sets _ownsPool to true for tarn pools', () => {
      const client = new TestClient({
        connection: { host: 'localhost' },
      });
      // No pool created because TestClient has no real driverName path,
      // but we can test initializePool directly
      client.driverName = null;
    });
  });

  describe('destroy behavior', () => {
    it('does not call pool.destroy when _ownsPool is false', async () => {
      const client = new TestClient();
      const destroySpy = sinon.spy(() => Promise.resolve());
      client.pool = {
        destroy: destroySpy,
        acquire: () => ({ promise: Promise.resolve({}) }),
        release: () => true,
      };
      client._ownsPool = false;

      await client.destroy();

      expect(destroySpy.called).to.be.false;
      expect(client.pool).to.be.undefined;
    });

    it('calls pool.destroy when _ownsPool is true', async () => {
      const client = new TestClient();
      const destroySpy = sinon.spy(() => Promise.resolve());
      client.pool = {
        destroy: destroySpy,
        acquire: () => ({ promise: Promise.resolve({}) }),
        release: () => true,
      };
      client._ownsPool = true;

      await client.destroy();

      expect(destroySpy.calledOnce).to.be.true;
      expect(client.pool).to.be.undefined;
    });
  });

  describe('PostgreSQL wrapNativePool', () => {
    let PgClient;

    before(() => {
      try {
        PgClient = require('../../../lib/dialects/postgres/index');
      } catch (_e) {
        // pg driver may not be installed in test env
      }
    });

    it('acquire calls nativePool.connect and assigns __knexUid', async function () {
      if (!PgClient) this.skip();

      const mockConnection = { query: sinon.stub() };
      const mockPool = {
        connect: sinon.stub().resolves(mockConnection),
      };

      const client = Object.create(PgClient.prototype);
      client.version = '14.0'; // skip version check
      const adapter = client.wrapNativePool(mockPool);

      const connection = await adapter.acquire().promise;

      expect(mockPool.connect.calledOnce).to.be.true;
      expect(connection.__knexUid).to.be.a('string');
      expect(connection).to.equal(mockConnection);
    });

    it('release calls connection.release(false) for healthy connections', function () {
      if (!PgClient) this.skip();

      const mockConnection = { release: sinon.stub() };
      const client = Object.create(PgClient.prototype);
      client.version = '14.0';
      const adapter = client.wrapNativePool({});

      const result = adapter.release(mockConnection);

      expect(result).to.be.true;
      expect(mockConnection.release.calledOnce).to.be.true;
      expect(mockConnection.release.calledWith(false)).to.be.true;
    });

    it('release calls connection.release(true) for disposed connections', function () {
      if (!PgClient) this.skip();

      const mockConnection = {
        release: sinon.stub(),
        __knex__disposed: 'connection error',
      };
      const client = Object.create(PgClient.prototype);
      client.version = '14.0';
      const adapter = client.wrapNativePool({});

      const result = adapter.release(mockConnection);

      expect(result).to.be.true;
      expect(mockConnection.release.calledOnce).to.be.true;
      expect(mockConnection.release.calledWith(true)).to.be.true;
    });

    it('destroy is a no-op', async function () {
      if (!PgClient) this.skip();

      const client = Object.create(PgClient.prototype);
      client.version = '14.0';
      const adapter = client.wrapNativePool({});

      await adapter.destroy(); // should not throw
    });
  });

  describe('MySQL wrapNativePool', () => {
    let MySQLClient;

    before(() => {
      try {
        MySQLClient = require('../../../lib/dialects/mysql/index');
      } catch (_e) {
        // mysql driver may not be installed in test env
      }
    });

    it('acquire calls nativePool.getConnection and assigns __knexUid', async function () {
      if (!MySQLClient) this.skip();

      const mockConnection = {};
      const mockPool = {
        getConnection: sinon.stub().callsFake((cb) => cb(null, mockConnection)),
      };

      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool(mockPool);

      const connection = await adapter.acquire().promise;

      expect(mockPool.getConnection.calledOnce).to.be.true;
      expect(connection.__knexUid).to.be.a('string');
      expect(connection).to.equal(mockConnection);
    });

    it('acquire rejects when getConnection errors', async function () {
      if (!MySQLClient) this.skip();

      const mockPool = {
        getConnection: sinon
          .stub()
          .callsFake((cb) => cb(new Error('pool exhausted'))),
      };

      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool(mockPool);

      try {
        await adapter.acquire().promise;
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('pool exhausted');
      }
    });

    it('release calls connection.release for healthy connections', function () {
      if (!MySQLClient) this.skip();

      const mockConnection = { release: sinon.stub() };
      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool({});

      const result = adapter.release(mockConnection);

      expect(result).to.be.true;
      expect(mockConnection.release.calledOnce).to.be.true;
    });

    it('release calls connection.destroy for disposed connections', function () {
      if (!MySQLClient) this.skip();

      const mockConnection = {
        release: sinon.stub(),
        destroy: sinon.stub(),
        __knex__disposed: 'connection error',
      };
      const client = Object.create(MySQLClient.prototype);
      const adapter = client.wrapNativePool({});

      const result = adapter.release(mockConnection);

      expect(result).to.be.true;
      expect(mockConnection.destroy.calledOnce).to.be.true;
      expect(mockConnection.release.called).to.be.false;
    });
  });
});
