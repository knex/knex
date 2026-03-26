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
    vi.restoreAllMocks();
  });

  it('awaits async pool.validate and rejects when it returns false', async () => {
    const client = new TestClient();
    const userValidate = vi.fn(async () => false);

    const poolConfig = client.getPoolSettings({ validate: userValidate });
    const result = await poolConfig.validate({});

    expect(userValidate).toHaveBeenCalledOnce();
    expect(result).toBe(false);
  });

  it('rejects connections past max lifetime', async () => {
    const client = new TestClient();
    const poolConfig = client.getPoolSettings({
      maxConnectionLifetimeMillis: 1,
    });
    const connection = { __knexLifetimeLimit: -1 };

    const result = await poolConfig.validate(connection);

    expect(result).toBe(false);
  });

  it('refreshes config and drops connection when expired on validate', async () => {
    const client = new TestClient();
    const providerResult = { host: 'new-host' };
    client.connectionConfigProvider = vi.fn().mockResolvedValue(providerResult);
    client.connectionConfigExpirationChecker = vi.fn().mockReturnValue(true);

    const poolConfig = client.getPoolSettings({});
    const result = await poolConfig.validate({});

    expect(client.connectionConfigProvider).toHaveBeenCalledOnce();
    expect(client.connectionSettings).toEqual(providerResult);
    expect(result).toBe(false);
  });

  it('does not warn when pool.validate is provided', () => {
    const client = new TestClient();
    const warnSpy = vi.spyOn(client.logger, 'warn');

    client.getPoolSettings({ validate: () => true });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs and rejects when user validate throws', async () => {
    const client = new TestClient();
    const warnSpy = vi.spyOn(client.logger, 'warn');
    const userValidate = vi.fn().mockRejectedValue(new Error('boom'));

    const poolConfig = client.getPoolSettings({ validate: userValidate });
    const result = await poolConfig.validate({});

    expect(userValidate).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain(
      'Pool validate threw an error: boom'
    );
    expect(result).toBe(false);
  });

  it('assigns lifetime with jitter when missing and keeps valid', async () => {
    vi.useFakeTimers({ now: 1000 });
    const client = new TestClient();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // halfway jitter
    const poolConfig = client.getPoolSettings({
      maxConnectionLifetimeMillis: 1000,
      maxConnectionLifetimeJitterMillis: 1000,
    });
    const connection = {};

    let result = await poolConfig.validate(connection);
    expect(result).toBe(true);

    // Advance to just before expiry (base + jitter/2)
    vi.advanceTimersByTime(1000 + 500 - 1);
    result = await poolConfig.validate(connection);
    expect(result).toBe(true);

    // Advance past expiry
    vi.advanceTimersByTime(2);
    result = await poolConfig.validate(connection);
    expect(result).toBe(false);

    vi.useRealTimers();
  });

  it('throws when expiration checker stays true after refresh', async () => {
    const client = new TestClient();
    const providerResult = {
      host: 'newer',
      expirationChecker: () => true,
    };
    client.connectionConfigProvider = vi.fn().mockResolvedValue(providerResult);
    const checker = vi.fn().mockReturnValue(true);
    client.connectionConfigExpirationChecker = checker;

    const poolConfig = client.getPoolSettings({});
    let caught;
    try {
      await poolConfig.validate({});
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toContain(
      'Connection configuration still reported expired after refresh'
    );
    expect(client.connectionSettings).toEqual({ host: 'newer' });
    expect(typeof client.connectionConfigExpirationChecker).toBe('function');
    expect(client.connectionConfigProvider).toHaveBeenCalledOnce();
  });
});
