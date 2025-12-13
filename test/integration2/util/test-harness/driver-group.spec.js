// @ts-check

/** @typedef {import('./helpers').DriverName} DriverName */
/** @typedef {import('./helpers').DriverSelector} DriverSelector */
/** @typedef {import('./helpers').SelectorName} SelectorName */

const { expect } = require('chai');
const { DriverGroup } = require('./driver-group');

class Mock extends DriverGroup {
  /**
   * @param {readonly DriverName[]} [drivers]
   * @param {readonly DriverName[]} [env]
   */
  constructor(drivers, env) {
    super(drivers, env);
  }
}

describe('DriverGroup', () => {
  describe('constructor', () => {
    it('instantiates correctly', () => {
      // 0 args
      new Mock();

      // 1 arg
      new Mock(['pg']);

      // 2 args; don't have to intersect
      new Mock(['pg'], ['mysql']);

      // static factory
      DriverGroup.select(['pg']);
    });
  });

  describe('select', () => {
    it('narrows the selected set', () => {
      /** @type {{init: DriverName[], select: DriverSelector, expected: DriverName[]}[]} */
      const table = [
        { init: ['pg', 'mysql'], select: 'pg', expected: ['pg'] },
        { init: ['pg', 'mysql'], select: 'pg~', expected: ['pg'] },
        { init: ['pg', 'mysql'], select: ['pg'], expected: ['pg'] },
      ];
      for (const { init, select, expected } of table) {
        const dg = DriverGroup.select(init);
        expect(dg.select(select).selected()).to.deep.equal(expected);
      }
    });

    it('maintains the environment property', () => {
      const dg = new Mock(undefined, ['pg']).select('mysql');
      expect(dg.enabled()).to.deep.equal([]);
    });
  });

  describe('exclude', () => {
    /** @type {{init: DriverName[], exclude: SelectorName|SelectorName[], expected: DriverName[]}[]} */
    const table = [
      { init: ['pg', 'mysql'], exclude: 'pg', expected: ['mysql'] },
      { init: ['pg', 'mysql'], exclude: 'pg~', expected: ['mysql'] },
      { init: ['pg', 'mysql'], exclude: ['pg'], expected: ['mysql'] },
    ];
    for (const { init, exclude, expected } of table) {
      const dg = DriverGroup.select(init);
      expect(dg.except(exclude).selected()).to.deep.equal(expected);
    }
  });

  describe('enabled', () => {
    it('(no arg) returns the enabled drivers given the environment', () => {
      /** @type {{selected: DriverName[], env: DriverName[], expected: DriverName[]}[]} */
      const table = [
        { selected: ['mysql', 'sqlite3'], env: ['pg'], expected: [] },
        {
          selected: ['mysql', 'sqlite3'],
          env: ['pg', 'mysql'],
          expected: ['mysql'],
        },
      ];

      for (const { selected, env, expected } of table) {
        const dg = new Mock(selected, env);
        expect(dg.enabled()).to.deep.equal(expected);
      }
    });

    it('(with arg) returns whether the given driver is enabled AND selected', () => {
      /** @type {{query: DriverName, selected: DriverName[], env: DriverName[], expected: boolean}[]} */
      const table = [
        { query: 'sqlite3', selected: ['mysql'], env: ['pg'], expected: false },
        {
          query: 'sqlite3',
          selected: ['mysql'],
          env: ['pg', 'sqlite3'],
          expected: false,
        },
        {
          query: 'sqlite3',
          selected: ['mysql', 'sqlite3'],
          env: ['pg'],
          expected: false,
        },
        {
          query: 'sqlite3',
          selected: ['mysql', 'sqlite3'],
          env: ['pg', 'sqlite3'],
          expected: true,
        },
      ];
      for (const { query, selected, env, expected } of table) {
        const dg = new Mock(selected, env);
        expect(dg.enabled(query)).to.deep.equal(expected);
      }
    });
  });
});
