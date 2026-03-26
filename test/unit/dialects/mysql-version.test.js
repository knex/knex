'use strict';

const Client_MySQL = require('../../../lib/dialects/mysql');

function createConnection(versionString, tracker) {
  return {
    query(sql, callback) {
      tracker.count += 1;
      callback(null, [{ version: versionString }]);
    },
  };
}

describe('MySQL/MariaDB version detection', () => {
  it('detects MariaDB and parses the version number', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const connection = createConnection(
      '10.5.17-MariaDB-1:10.5.17+maria~bionic',
      tracker
    );

    const version = await client.checkVersion(connection);

    expect(version).toBe('10.5.17');
    expect(client.isMariaDB).toBe(true);
    expect(tracker.count).toBe(1);
  });

  it('detects MySQL and parses the version number', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const connection = createConnection('8.0.36', tracker);

    const version = await client.checkVersion(connection);

    expect(version).toBe('8.0.36');
    expect(client.isMariaDB).toBe(false);
    expect(tracker.count).toBe(1);
  });

  it('does not override a user-specified version', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({
      client: 'mysql',
      connection: null,
      version: '5.7.30',
    });
    const connection = createConnection('10.11.6-MariaDB', tracker);

    const version = await client.checkVersion(connection);

    expect(version).toBe('5.7.30');
    expect(client.version).toBe('5.7.30');
    expect(client.isMariaDB).toBe(false);
    expect(tracker.count).toBe(0);
  });

  it('detects MariaDB from a user-specified version string', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({
      client: 'mysql',
      connection: null,
      version: '10.11.6-MariaDB',
    });
    const connection = createConnection('8.0.36', tracker);

    const version = await client.checkVersion(connection);

    expect(version).toBe('10.11.6-MariaDB');
    expect(client.version).toBe('10.11.6-MariaDB');
    expect(client.isMariaDB).toBe(true);
    expect(tracker.count).toBe(0);
  });

  it('only runs the version query once per client', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const connection = createConnection('10.4.20-MariaDB', tracker);

    await client.checkVersion(connection);
    const secondConnection = createConnection('8.0.35', tracker);
    await client.checkVersion(secondConnection);

    expect(client.isMariaDB).toBe(true);
    expect(client.version).toBe('10.4.20');
    expect(tracker.count).toBe(1);
  });

  it('falls back to latest when version cannot be retrieved', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const warnings = [];
    client.logger.warn = (message) => warnings.push(message);
    const badConn = {
      query(sql, callback) {
        tracker.count += 1;
        callback(null, [{}]);
      },
    };

    const version = await client.checkVersion(badConn);

    expect(version).toBeNull();
    expect(client.version).toBeNull();
    expect(Boolean(client.isMariaDB)).toBe(false);
    expect(tracker.count).toBe(1);
    expect(warnings).toHaveLength(1);
  });

  it('falls back to latest when version string is unparseable', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const warnings = [];
    client.logger.warn = (message) => warnings.push(message);
    const badConn = createConnection('not-a-version-MariaDB', tracker);

    const version = await client.checkVersion(badConn);

    expect(version).toBeNull();
    expect(client.version).toBeNull();
    expect(client.isMariaDB).toBe(true);
    expect(tracker.count).toBe(1);
    expect(warnings).toHaveLength(1);
  });

  it('treats configured version "latest" as an escape hatch', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({
      client: 'mysql',
      connection: null,
      version: 'latest',
    });
    const warnings = [];
    client.logger.warn = (message) => warnings.push(message);
    const connection = createConnection('8.0.36', tracker);

    const version = await client.checkVersion(connection);

    expect(version).toBeNull();
    expect(client.version).toBeNull();
    expect(tracker.count).toBe(0);
    expect(warnings).toHaveLength(0);
  });

  it('acquireRawConnection resolves when version detection throws', async () => {
    const client = new Client_MySQL({ client: 'mysql', connection: {} });
    const tracker = { destroyed: false, listenersCleared: false };
    const warnings = [];
    client.logger.warn = (message) => warnings.push(message);
    const connection = {
      state: 'connected',
      on() {},
      connect(callback) {
        callback(null);
      },
      destroy() {
        tracker.destroyed = true;
      },
      removeAllListeners() {
        tracker.listenersCleared = true;
      },
    };

    // Force checkVersion to throw
    client.checkVersion = async () => {
      throw new Error('boom');
    };

    // Stub driver
    client.driver = {
      createConnection() {
        return connection;
      },
    };

    const acquired = await client.acquireRawConnection();

    expect(acquired).toBe(connection);
    expect(tracker.destroyed).toBe(false);
    expect(tracker.listenersCleared).toBe(false);
    expect(warnings).toHaveLength(1);
  });

  it('acquireRawConnection resolves and runs version check once connected', async () => {
    const client = new Client_MySQL({ client: 'mysql', connection: {} });
    const connection = {
      state: 'connected',
      removeAllListenersCalled: false,
      on() {},
      connect(callback) {
        callback(null);
      },
      removeAllListeners() {
        this.removeAllListenersCalled = true;
      },
    };

    const versionCalls = [];
    client.checkVersion = async (conn) => {
      versionCalls.push(conn);
      return '8.0.36';
    };
    client.driver = {
      createConnection() {
        return connection;
      },
    };

    const acquired = await client.acquireRawConnection();

    expect(acquired).toBe(connection);
    expect(versionCalls).toHaveLength(1);
    expect(connection.removeAllListenersCalled).toBe(false);
  });

  it('acquireRawConnection rejects on connect error and clears listeners', async () => {
    const client = new Client_MySQL({ client: 'mysql', connection: {} });
    const connection = {
      state: 'disconnected',
      removed: false,
      on() {},
      connect(callback) {
        callback(new Error('connect failed'));
      },
      removeAllListeners() {
        this.removed = true;
      },
    };
    client.driver = {
      createConnection() {
        return connection;
      },
    };

    try {
      await client.acquireRawConnection();
      throw new Error('expected acquireRawConnection to reject');
    } catch (err) {
      expect(err.message).toBe('connect failed');
      expect(connection.removed).toBe(true);
    }
  });
});
