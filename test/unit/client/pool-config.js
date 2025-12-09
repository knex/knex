const { expect } = require('chai');
const sinon = require('sinon');
const Client = require('../../../lib/client');

class TestClient extends Client {
  constructor(config = {}) {
    super({ ...config, client: 'test' });
    this.driverName = null;
  }

  validateConnection() {
    return true;
  }
}

describe('Client pool settings', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('awaits async pool.validate and rejects when it returns false', async () => {
    const client = new TestClient();
    const userValidate = sinon.spy(async () => false);

    const poolConfig = client.getPoolSettings({ validate: userValidate });
    const result = await poolConfig.validate({});

    expect(userValidate.calledOnce).to.be.true;
    expect(result).to.be.false;
  });

  it('rejects connections past max lifetime', async () => {
    const client = new TestClient();
    const poolConfig = client.getPoolSettings({
      maxConnectionLifetimeMillis: 1,
    });
    const connection = { __knexLifetimeLimit: Date.now() - 1000 };

    const result = await poolConfig.validate(connection);

    expect(result).to.be.false;
  });

  it('refreshes config and drops connection when expired on validate', async () => {
    const client = new TestClient();
    const providerResult = { host: 'new-host' };
    client.connectionConfigProvider = sinon.stub().resolves(providerResult);
    client.connectionConfigExpirationChecker = sinon.stub().returns(true);

    const poolConfig = client.getPoolSettings({});
    const result = await poolConfig.validate({});

    expect(client.connectionConfigProvider.calledOnce).to.be.true;
    expect(client.connectionSettings).to.deep.equal(providerResult);
    expect(result).to.be.false;
  });

  it('does not warn when pool.validate is provided', () => {
    const client = new TestClient();
    const warnSpy = sinon.spy(client.logger, 'warn');

    client.getPoolSettings({ validate: () => true });

    expect(warnSpy.called).to.be.false;
  });

  it('logs and rejects when user validate throws', async () => {
    const client = new TestClient();
    const warnSpy = sinon.spy(client.logger, 'warn');
    const userValidate = sinon.stub().rejects(new Error('boom'));

    const poolConfig = client.getPoolSettings({ validate: userValidate });
    const result = await poolConfig.validate({});

    expect(userValidate.calledOnce).to.be.true;
    expect(warnSpy.calledOnce).to.be.true;
    expect(result).to.be.false;
  });

  it('assigns lifetime with jitter when missing and keeps valid', async () => {
    const clock = sinon.useFakeTimers({ now: 1000 });
    const client = new TestClient();
    sinon.stub(Math, 'random').returns(0.5); // halfway jitter
    const poolConfig = client.getPoolSettings({
      maxConnectionLifetimeMillis: 1000,
      maxConnectionLifetimeJitterMillis: 1000,
    });
    const connection = {};

    const result = await poolConfig.validate(connection);

    expect(connection.__knexLifetimeLimit).to.equal(1000 + 1000 + 500);
    expect(result).to.be.true;
    clock.restore();
  });

  it('disables expiration checker if refresh still reports expired', async () => {
    const client = new TestClient();
    const providerResult = { host: 'newer' };
    client.connectionConfigProvider = sinon.stub().resolves(providerResult);
    const checker = sinon.stub().returns(true);
    client.connectionConfigExpirationChecker = checker;

    const poolConfig = client.getPoolSettings({});
    const firstResult = await poolConfig.validate({});

    expect(firstResult).to.be.false;
    expect(client.connectionSettings).to.deep.equal(providerResult);
    expect(client.connectionConfigExpirationChecker).to.equal(null);
    expect(client.connectionConfigProvider.calledOnce).to.be.true;

    const secondResult = await poolConfig.validate({});

    expect(secondResult).to.be.true;
    expect(client.connectionConfigProvider.calledOnce).to.be.true;
  });
});
