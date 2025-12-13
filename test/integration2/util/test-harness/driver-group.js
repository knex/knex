// @ts-check

/** @typedef {import('./helpers').DriverName} DriverName */
/** @typedef {import('./helpers').SelectorName} SelectorName */
/** @typedef {import('./helpers').DriverSelector} DriverSelector */

const { ENV_DRIVERS } = require('./defaults');
const {
  DRIVER_NAMES,
  expandDriverGroups,
  excludeDriverGroups,
  assertValidDrivers,
} = require('./helpers');

/**
 * Helper class to manage a selection of drivers and filter it by
 * the configured environment
 */
class DriverGroup {
  /**
   * The list of drivers enabled in the environment
   *
   * @private
   * @type {readonly DriverName[]}
   */
  _env;

  /**
   * The list of selected drivers
   *
   * @private
   * @type {readonly DriverName[]}
   */
  _selected;

  /**
   * @protected
   * @param {readonly DriverName[]} [drivers]
   * @param {readonly DriverName[]} [env]
   */
  constructor(drivers = DRIVER_NAMES, env = ENV_DRIVERS) {
    this._env = assertValidDrivers(env);
    this._selected = assertValidDrivers(drivers);
  }

  /**
   * Selects a list of of drivers matching the selector and returns a DriverGroup
   *
   * @param {DriverSelector} selector
   * @returns {DriverGroup}
   */
  static select(selector) {
    return new DriverGroup().select(selector);
  }

  /**
   * Selects a subset of drivers matching the selector and returns a new DriverGroup
   *
   * @param {DriverSelector} selector
   * @throws {Error}
   * @returns {DriverGroup}
   */
  select(selector) {
    return new DriverGroup(
      expandDriverGroups(selector, this._selected),
      this._env
    );
  }

  /**
   * Selects a subset of drivers NOT matching the selector and returns a new DriverGroup
   *
   * @param {SelectorName|SelectorName[]} selector
   * @throws {Error}
   * @returns {DriverGroup}
   */
  except(selector) {
    return new DriverGroup(
      excludeDriverGroups(selector, this._selected),
      this._env
    );
  }

  /**
   * Return an array of the intersection of selected drivers and enabled
   * drivers.
   *
   * @overload
   * @return {DriverName[]}
   */
  /**
   * Return true if the supplied name is both selected and enabled,
   * otherwise false.
   * @overload
   * @param {DriverName} name
   * @return {boolean}
   */
  /**
   * @param {DriverName} [name]
   * @return {DriverName[]|boolean}
   */
  enabled(name) {
    if (name !== undefined) {
      return this._selected.includes(name) && this._env.includes(name);
    } else {
      return this._selected.filter((name) => this._env.includes(name));
    }
  }

  /**
   * Return an array of the selected drivers
   *
   * @returns {readonly DriverName[]}
   */
  selected() {
    return this._selected.slice();
  }
}

module.exports = { DriverGroup };
