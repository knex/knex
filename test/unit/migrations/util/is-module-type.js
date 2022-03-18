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

  const getFile = (package, filename) =>
    path.resolve(__dirname, `test/${package}/${filename}`);

  it('should return false with type=commonjs and a .js file', async () => {
    expect(await isModuleType(getFile('commonjs', 'test.js'))).to.be.false;
  });

  it('should return true with type=commonjs and a .mjs file', async () => {
    expect(await isModuleType(getFile('commonjs', 'test.mjs'))).to.be.true;
  });

  it('should return true with type=module and a .js file', async () => {
    expect(await isModuleType(getFile('module', 'test.js'))).to.be.true;
  });

  it('should return false with type=module and a .cjs file', async () => {
    expect(await isModuleType(getFile('module', 'test.cjs'))).to.be.false;
  });

  it('should return true if type=module with npm < 7.0.0', async () => {
    process.env.npm_package_type = 'module';
    expect(await isModuleType(getFile('module', 'test.js'))).to.be.true;
  });

  it('should return false if type=commonjs with npm < 7.0.0', async () => {
    process.env.npm_package_type = 'commonjs';
    expect(await isModuleType(getFile('commonjs', 'test.js'))).to.be.false;
  });
});
