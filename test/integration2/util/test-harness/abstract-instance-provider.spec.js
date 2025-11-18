// @ts-check

/** @typedef {import('./abstract-instance-provider')} InstanceProvider */
/** @typedef {import('./helpers').DriverName} DriverName */
/** @typedef {import('./helpers').SelectorName} SelectorName */
/** @typedef {import('./helpers').DriverSelector} DriverSelector */
/** @typedef {import('../../../../types/index').Knex} Knex*/

const { expect } = require('chai');
const { DriverGroup } = require('./driver-group');
const { AbstractInstanceProvider } = require('./abstract-instance-provider');
const { DRIVER_NAMES, expandDriverGroups } = require('./helpers');
/**
 * @extends AbstractInstanceProvider<{}>
 */
class MockProvider extends AbstractInstanceProvider {
  /**
   * @override
   * @protected
   */
  _getKnex() {
    return {};
  }

  /**
   * @protected
   * @param {{}} knex
   * @param {DriverName} name
   * @param {(knex: {}, name: DriverName) => void} cb
   */
  _filtered(knex, name, cb) {
    cb(knex, name);
  }

  /**
   * @abstract
   * @protected
   * @param {string} title
   * @param {{}} knex
   * @param {DriverName} name
   * @param {(knex: {}, name: DriverName) => void} cb
   */
  _block(title, knex, name, cb) {
    cb(knex, name);
  }
}

class MockDriverGroup extends DriverGroup {
  /**
   * @param {readonly DriverName[]} [drivers]
   * @param {readonly DriverName[]} [env]
   */
  constructor(drivers, env) {
    super(drivers, env);
  }
}

describe('InstanceProvider', () => {
  describe('top-level block', () => {
    const ALL_DRIVERS = /** @type {DriverName[]} */ (DRIVER_NAMES);

    /** @typedef {{selection: DriverSelector, method: 'each'}} EachTest */
    /** @typedef {{selection: Exclude<DriverSelector, '*'>, method: 'except'}} ExceptTest */
    /** @typedef {{env: DriverSelector, expected: DriverName[]}} CommonTest */
    /** @type {((EachTest|ExceptTest) & CommonTest)[]} */
    // prettier-ignore
    const table = [
      { env: '*',                  method: 'each',    selection: '*',      expected: ALL_DRIVERS }, // full overlap
      { env: 'mysql~',             method: 'each',    selection: 'pg~',    expected: [] },          // no overlap
      { env: 'mysql',              method: 'each',    selection: '*',      expected: ['mysql'] },   // env subset of selection
      { env: '*',                  method: 'each',    selection: 'mysql',  expected: ['mysql'] },   // selection subset of env
      
      { env: ['pg~', 'sqlite3'],   method: 'except',  selection: 'pg~',    expected: ['sqlite3'] }, // exclusion
    ];

    for (const { env, selection, method, expected } of table) {
      it(`(env: ${JSON.stringify(env)}) ${method}(${JSON.stringify(
        selection
      )}, ...) calls back with ${JSON.stringify(expected)}`, () => {
        /** @type {any} */
        let last = undefined;

        /** @type {DriverName[]} */
        const called = [];

        const group = new MockDriverGroup(
          expandDriverGroups('*'),
          expandDriverGroups(env)
        );

        const ip = new MockProvider(group);

        ip[method](/** @type {any}*/ (selection), (knex, name) => {
          // assert that the called instances are not the same object
          expect(knex).not.to.equal(last);
          last = knex;
          called.push(name);
        });

        // assert that exactly what we expected to be called with actually happened
        expect(called).to.deep.equal(expected);
      });
    }
  });

  describe('child block', () => {
    const ALL_DRIVERS = /** @type {DriverName[]} */ (DRIVER_NAMES);

    /** @typedef {{selection: DriverSelector, method: 'each'}} EachTest */
    /** @typedef {{selection: Exclude<DriverSelector, '*'>, method: 'except'}} ExceptTest */
    /** @typedef {{parent: DriverSelector, expected: DriverName[]}} CommonTest */
    /** @type {((EachTest|ExceptTest) & CommonTest)[]} */
    // prettier-ignore
    const table = [
      { parent: '*',                  method: 'each',    selection: '*',      expected: ALL_DRIVERS }, // full overlap
      { parent: 'mysql',              method: 'each',    selection: '*',      expected: ['mysql'] },   // env subset of selection
      { parent: '*',                  method: 'each',    selection: 'mysql',  expected: ['mysql'] },   // selection subset of env
      
      { parent: ['pg~', 'sqlite3'],   method: 'except',  selection: 'pg~',    expected: ['sqlite3'] }, // exclusion
    ];

    for (const { parent, selection, method, expected } of table) {
      it(`(parent: ${JSON.stringify(parent)}) ${method}(${JSON.stringify(
        selection
      )}, ...) calls back with ${JSON.stringify(expected)}`, () => {
        /** @type {DriverName[]} */
        const called = [];

        const group = new MockDriverGroup(
          expandDriverGroups('*'),
          expandDriverGroups('*')
        );
        const ip = new MockProvider(group);

        let outerCount = 0;
        let innerCount = 0;
        ip.each(parent, (outer, oname) => {
          outerCount++;

          ip[method](/** @type {any}*/ (selection), (inner, iname) => {
            innerCount++;

            // assert that we receive the same instance (referential equality)
            // in the child as the parent
            expect(outer).to.equal(inner);
            // and the names are the same
            expect(oname).to.equal(iname);

            called.push(iname);
          });
        });

        // expect no fan-out
        expect(innerCount).to.be.lessThanOrEqual(outerCount);

        // assert that we were called with only what we expected
        expect(called).to.deep.equal(expected);
      });
    }

    it('fails if the child can never define a test', () => {
      const group = new MockDriverGroup(
        expandDriverGroups('*'),
        expandDriverGroups('*')
      );
      const ip = new MockProvider(group);

      ip.each('mysql', () => {
        expect(() => ip.each('pg', () => {})).to.throw(
          /Selector has no overlap/
        );
      });
    });
  });
});
