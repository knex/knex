const path = require('path');

const isModuleType = require('../../../../lib/migrations/util/is-module-type.js');

describe('isModuleType', () => {
  const getFile = (pkg, filename) =>
    path.resolve(__dirname, `test/${pkg}/${filename}`);

  it('should return false with type=commonjs and a .js file', async () => {
    expect(await isModuleType(getFile('commonjs', 'test.js'))).toBe(false);
  });

  it('should return true with type=commonjs and a .mjs file', async () => {
    expect(await isModuleType(getFile('commonjs', 'test.mjs'))).toBe(true);
  });

  it('should return true with type=module and a .js file', async () => {
    expect(await isModuleType(getFile('module', 'test.js'))).toBe(true);
  });

  it('should return false with type=module and a .cjs file', async () => {
    expect(await isModuleType(getFile('module', 'test.cjs'))).toBe(false);
  });
});
