const { expect } = require('chai');
const {
  assertSaneDefaults,
  DEFAULT_DRIVERS,
  DEFAULT_EXCLUSIONS,
  getEnvDrivers,
} = require('./defaults');
const { DRIVER_NAMES } = require('./helpers');

describe('assertSaneDefaults', () => {
  it('testing environment defaults are well-defined', () => {
    // this will throw if the list of supported drivers changes in such a way
    // that the default drivers / exclusions declared in defaults.js are misaligned
    assertSaneDefaults(DEFAULT_DRIVERS, DEFAULT_EXCLUSIONS);
  });

  // test that the function actually works correctly
  it('does its job correctly', () => {
    const table = [
      // have overlap
      { defaults: DRIVER_NAMES, exclusions: DRIVER_NAMES },
      // has a gap
      { defaults: [], exclusions: [] },
    ];
    for (const { defaults, exclusions } of table) {
      expect(() => assertSaneDefaults(defaults, exclusions)).to.throw(
        /lists do not agree/
      );
    }
  });
});

describe('getEnvDrivers', () => {
  it('returns the defaults with an empty env', () => {
    const table = [undefined, '', '    '];
    for (const env of table) {
      expect(getEnvDrivers(env)).to.deep.equal(DEFAULT_DRIVERS);
    }
  });
  it('returns the selected drivers with a non-empty env', () => {
    expect(getEnvDrivers('pg mysql')).to.deep.equal(['pg', 'mysql']);
  });
  it('expands driver groups', () => {
    expect(getEnvDrivers('pg sqlite~')).to.deep.equal([
      'pg',
      'sqlite3',
      'better-sqlite3',
    ]);
  });
  it('throws an error if the env contains invalid drivers', () => {
    expect(() => getEnvDrivers('notadriver')).to.throw(
      /Invalid selector.*notadriver/
    );
  });
});
