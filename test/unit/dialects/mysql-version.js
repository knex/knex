'use strict';

const { expect } = require('chai');
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

    expect(version).to.equal('10.5.17');
    expect(client.isMariaDB).to.equal(true);
    expect(tracker.count).to.equal(1);
  });

  it('detects MySQL and parses the version number', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const connection = createConnection('8.0.36', tracker);

    const version = await client.checkVersion(connection);

    expect(version).to.equal('8.0.36');
    expect(client.isMariaDB).to.equal(false);
    expect(tracker.count).to.equal(1);
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

    expect(version).to.equal('5.7.30');
    expect(client.version).to.equal('5.7.30');
    expect(client.isMariaDB).to.equal(true);
    expect(tracker.count).to.equal(1);
  });

  it('only runs the version query once per client', async () => {
    const tracker = { count: 0 };
    const client = new Client_MySQL({ client: 'mysql', connection: null });
    const connection = createConnection('10.4.20-MariaDB', tracker);

    await client.checkVersion(connection);
    const secondConnection = createConnection('8.0.35', tracker);
    await client.checkVersion(secondConnection);

    expect(client.isMariaDB).to.equal(true);
    expect(client.version).to.equal('10.4.20');
    expect(tracker.count).to.equal(1);
  });
});
