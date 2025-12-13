/** @typedef {import('./helpers').DriverName} DriverName */
/** @typedef {import('./helpers').SelectorName} SelectorName */
/** @typedef {import('./helpers').DriverSelector} DriverSelector */

const { expect } = require('chai');
const {
  DRIVER_NAMES,
  lazy,
  destroyLazy,
  assertValidDrivers,
  expandDriverGroups,
  excludeDriverGroups,
} = require('./helpers');

describe('helpers', () => {
  describe('lazy', () => {
    it('does not instantiate until used', () => {
      let called = false;
      const proxy = lazy(() => {
        called = true;
        const inst = { foo: 1 };
        return inst;
      });
      expect(called).to.be.false;
      expect(proxy.foo).to.equal(1);
      expect(proxy.foo).to.equal(1); // ensure it works after lazy instantiation too

      expect(called).to.be.true;
    });

    it('does not instantiate if destroyed', () => {
      let called = false;
      const proxy = lazy(() => {
        called = true;
        return {};
      });
      destroyLazy(proxy);
      expect(() => proxy.foo).to.throw(/Property access on out-of-scope lazy/);
      expect(called).to.be.false;
    });

    it('correctly binds `this`', () => {
      const proxy = lazy(() => {
        const inst = {
          foo() {
            return this;
          },
          bar: 1,
        };
        return inst;
      });
      expect(proxy.foo().bar).to.equal(1);
    });

    it('supports proxying functions', () => {
      const proxy = lazy(() => () => 1);
      expect(proxy()).to.equal(1);
    });

    it('does not call if destroyed', () => {
      const proxy = lazy(() => () => 1);
      destroyLazy(proxy);
      expect(() => proxy()).to.throw(/Function call on out-of-scope lazy/);
    });
  });

  describe('assertValidDrivers', () => {
    const str = (v) => {
      if (v == null || typeof v !== 'object') return JSON.stringify(v);
      if (Array.isArray(v)) return `[${v.map(str).join(', ')}]`;
      return v.constructor.name;
    };

    const invalids = [null, 0, new Date(), {}, [], ['pg~'], ['pg', 'foo']];
    it('throws on invalid values', () => {
      for (const inv of invalids) {
        let res;
        try {
          res = assertValidDrivers(inv);
        } catch (e) {
          res = e;
        }
        if (res instanceof Error) {
          expect(res.message).to.match(/Invalid driver/);
        } else {
          expect.fail(`Expected ${str(inv)} to fail, but it didn't`);
        }
      }
    });

    const valids = [['pg']];
    it('accepts valid values', () => {
      for (const valid of valids) {
        expect(assertValidDrivers(valid)).to.deep.equal(valid);
      }
    });
  });

  describe('expandDriverGroups', () => {
    /** @type {{selector: DriverSelector, expected: DriverName[]}[]} */
    const success = [
      // * expands to everything
      { selector: '*', expected: DRIVER_NAMES },
      // single values become arrays
      { selector: 'mysql', expected: ['mysql'] },
      // single-valued arrays also okay
      { selector: ['mysql'], expected: ['mysql'] },
      // groups expand
      { selector: 'mysql~', expected: ['mysql', 'mysql2'] },
      { selector: ['mysql~'], expected: ['mysql', 'mysql2'] },
      // multiple values
      { selector: ['pg', 'mysql'], expected: ['pg', 'mysql'] },
      // groups expand from multi-value inputs
      { selector: ['pg', 'mysql~'], expected: ['pg', 'mysql', 'mysql2'] },
    ];

    it('renders an array of DriverName from a selector', () => {
      for (const { selector, expected } of success) {
        expect(expandDriverGroups(selector)).to.deep.equal(expected);
      }
    });

    it('throws on invalid selectors', () => {
      const fail = ['not a driver', [], ['pg', 'not a driver'], 'pg~', `pg`];
      for (const selector of fail) {
        expect(() => expandDriverGroups(selector, ['mysql'])).to.throw(
          /Invalid selector/
        );
      }
    });

    it('selects only members from the supplied parent', () => {
      for (const { selector } of success) {
        // some of the success tests are invalid in this tight parent scope,
        // but the remaining ones cover what we want to cover
        const filtered = Array.isArray(selector)
          ? selector.filter((v) => !v.startsWith('pg'))
          : selector;
        expect(expandDriverGroups(filtered, ['mysql'])).to.deep.equal([
          'mysql',
        ]);
      }
    });
  });

  describe('excludeDriverGroups', () => {
    /** @type {{parent: DriverName[], selector: DriverSelector }[]} */
    const success = [
      // single values become arrays
      { parent: ['mysql', 'pg'], selector: 'mysql' },
      // single-valued arrays also okay
      { parent: ['mysql', 'pg'], selector: ['mysql'] },
      // groups expand
      { parent: ['mysql', 'pg'], selector: 'mysql~' },
      { parent: ['mysql', 'pg'], selector: ['mysql~'] },
      // multiple values
      { parent: ['mysql', 'pg', 'mssql'], selector: ['mysql', 'mssql'] },
      // groups expand from multi-value inputs
      { parent: ['mysql', 'pg', 'mssql'], selector: ['mysql~', 'mssql'] },
    ];
    const fail = ['not a driver', [], ['pg', 'not a driver']];
    /** @type {{parent: DriverName[], selector: DriverSelector }[]} */
    const errors = [
      // all drivers excluded
      { parent: ['mysql'], selector: 'mysql' },
    ];
    it('renders an array of DriverName from a selector', () => {
      for (const { parent, selector } of success) {
        expect(excludeDriverGroups(selector, parent)).to.deep.equal(['pg']);
      }
    });

    it('throws on invalid selectors', () => {
      for (const selector of fail) {
        expect(() => excludeDriverGroups(selector, ['mysql', 'pg'])).to.throw(
          /Invalid selector/
        );
      }
    });

    it('throws on empty selections', () => {
      for (const { parent, selector } of errors) {
        expect(() => excludeDriverGroups(selector, parent)).to.throw(
          /excluded all drivers/
        );
      }
    });
  });
});
