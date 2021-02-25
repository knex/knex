const path = require('path');

const { expect } = require('chai');
const isModuleType = require('../../../../lib/migrations/util/is-module-type.js');
require('../../../util/chai-setup');

describe('isModuleType', () => {
  let originalEnv = {};

  before(() => {
    originalEnv = { ...process.env };
    process.env = {};
  });

  after(() => {
    process.env = { ...originalEnv };
  });

  beforeEach(() => {
    delete process.env.npm_package_type;
    delete process.env.npm_package_json;
  });

  it('should return true if the file is a .mjs file', async () => {
    expect(await isModuleType('test.mjs')).to.be.true;
  });

  it('should return true if type=module with npm < 7.0.0', async () => {
    process.env.npm_package_type = 'module';
    expect(await isModuleType('test.js')).to.be.true;
  });

  it('should return false if type=commonjs with npm < 7.0.0', async () => {
    process.env.npm_package_type = 'commonjs';
    expect(await isModuleType('test.js')).to.be.false;
  });

  it('should return true if type=module with npm >= 7.0.0', async () => {
    process.env.npm_package_json = path.normalize(
      __dirname + '/test/package-module.json'
    );
    expect(await isModuleType('test.js')).to.be.true;
  });

  it('should return false if type=commonjs with npm >= 7.0.0', async () => {
    process.env.npm_package_json = path.normalize(
      __dirname + '/test/package-commonjs.json'
    );
    expect(await isModuleType('test.js')).to.be.false;
  });
});
