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

  it('runs connection expiration checker during validation', async () => {
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
});
