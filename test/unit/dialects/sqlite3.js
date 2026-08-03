'use strict';
const { expect } = require('chai');
const sinon = require('sinon');
const Client = require('../../../lib/client');
const SQLite3_Client = require('../../../lib/dialects/sqlite3');

describe('sqlite3 client unit tests', () => {
  let stubDriver;
  let stubPool;

  beforeEach(() => {
    stubDriver = sinon.stub(Client.prototype, 'initializeDriver');
    stubPool = sinon.stub(Client.prototype, 'initializePool');
  });

  afterEach(() => {
    stubDriver.restore();
    stubPool.restore();
  });

  const collectWarnings = (connection) => {
    const warnings = [];
    new SQLite3_Client({
      client: 'sqlite3',
      connection,
      useNullAsDefault: true,
      log: { warn: (msg) => warnings.push(msg) },
    });
    return warnings;
  };

  const isFilenameWarning = (m) => m.includes('`connection.filename`');

  describe('connection.filename warning', () => {
    it('warns when `connection.filename` is missing', () => {
      const warnings = collectWarnings({});
      expect(warnings.filter(isFilenameWarning).length).to.equal(1);
    });

    it('does not warn when `connection` is a function (config provider)', () => {
      const warnings = collectWarnings(() => ({ filename: ':memory:' }));
      expect(warnings.filter(isFilenameWarning)).to.be.empty;
    });

    it('does not warn when `connection.filename` is provided', () => {
      const warnings = collectWarnings({ filename: ':memory:' });
      expect(warnings.filter(isFilenameWarning)).to.be.empty;
    });
  });
});
