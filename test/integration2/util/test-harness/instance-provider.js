// @ts-check

/** @typedef {import('./helpers').DriverName} DriverName */
/** @typedef {import('./helpers').SelectorName} SelectorName */
/** @typedef {import('./helpers').DriverSelector} DriverSelector */
/** @typedef {import('../../../../types/index').Knex} Knex */

const { AbstractInstanceProvider } = require('./abstract-instance-provider');

const { lazy, destroyLazy } = require('./helpers');
const logger = require('../../../integration/logger');

// use the previous implementation's code to construct
// knex instances during the migration. this ensures that
// the configuration being used in the integration tests
// behaves the same as before
const old = require('../knex-instance-provider');

/**
 * @extends AbstractInstanceProvider<Knex>
 */
class InstanceProvider extends AbstractInstanceProvider {
  /**
   * Get an instance of knex for the given driver
   *
   * @override
   * @protected
   * @param {DriverName} driver
   * @returns {Knex}
   */
  _getKnex(driver) {
    return lazy(() => {
      return logger(old.getKnexForDb(driver));
    });
  }

  /**
   * Execute the callback as a child block
   *
   * @protected
   * @type {AbstractInstanceProvider<Knex>['_filtered']}
   */
  _filtered(knex, driver, cb) {
    cb(knex, driver);
  }

  /**
   * Execute the callback as a root block
   *
   * @protected
   * @type {AbstractInstanceProvider<Knex>['_block']}
   */
  _block(title, knex, driver, cb) {
    const suite = describe(title, () => {
      cb(knex, driver);

      // add this hook _after_ the callback so that knex is not
      // destroyed before any hooks created inside the callback
      after(() => knex.destroy());
    });

    if (countTests(suite) === 0) {
      destroyLazy(knex);
    }
  }
}

/**
 * @param {Mocha.Suite} suite
 * @returns {number}
 */
const countTests = (suite) =>
  (suite.tests.length ?? 0) +
  suite.suites.reduce((acc, cur) => acc + countTests(cur), 0);

module.exports = {
  InstanceProvider,
  dbs: new InstanceProvider(),
};
