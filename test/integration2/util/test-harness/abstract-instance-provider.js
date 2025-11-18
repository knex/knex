// @ts-check

/** @typedef {import('./helpers').DriverName} DriverName */
/** @typedef {import('./helpers').SelectorName} SelectorName */
/** @typedef {import('./helpers').DriverSelector} DriverSelector */
/** @typedef {import('../../../../types/index').Knex} Knex */

const { errorWithProps } = require('./helpers');
const { DriverGroup } = require('./driver-group');

/**
 * @template T
 * @typedef {{selector: DriverSelector, group: DriverGroup, current: {name: DriverName, knex: T}}} Parent
 */

/**
 * @class
 * @abstract
 * @template T
 */
class AbstractInstanceProvider {
  /**
   * @protected
   * @type {Parent<T>|null}
   */
  _parent = null;

  /**
   * @protected
   * @type {DriverGroup}
   */
  _base;

  /**
   * @param {DriverGroup} [baseGroup]
   */
  constructor(baseGroup) {
    this._parent = null;
    this._base = baseGroup ?? DriverGroup.select('*');
  }

  /**
   * Runs the callback for each enabled driver identified by the selector.
   *
   * Creates an implicit `describe` block at the top level, instantiates
   * a `Knex` instance, and adds an `after` hook to destroy it when the
   * `describe` block is done.
   *
   * Top-level blocks have their title prefixed with the driver name
   *
   * @throws {Error}
   * @param {DriverSelector} selector
   * @param {(knex: T, name: DriverName) => void} cb
   */
  each(selector, cb) {
    const parent = this._parent;

    if (parent !== null) {
      try {
        const selection = parent.group.select(selector);
        const { name, knex } = parent.current;

        // we've just derived a subset from whatever our parent's group is. we're
        // in the middle of calling this method for every driver in that group,
        // but only some of those may be drivers we are interested in. check if
        // the currently-being-enumerated driver (in this._parent) is relevant to
        // our selection (newGroup). if so, call the callback
        if (selection.enabled(name)) {
          this._filtered(knex, name, cb);
        }

        return;
      } catch (e) {
        throw errorWithProps(
          'Selector has no overlap with the parent selection',
          {
            selector,
            parent: parent.group.selected(),
          }
        );
      }
    }

    // we're at the top level. start a new group, loop through all the _enabled_ drivers
    // of that group, and call the callback
    try {
      const group = this._base.select(selector);

      for (const name of group.enabled()) {
        const title = `Driver: ${name}`;
        const knex = this._getKnex(name);
        this._parent = { selector, group, current: { name, knex } };
        this._block(title, knex, name, cb);
      }
    } finally {
      this._parent = null;
    }
  }

  /**
   * Runs the callback for each enabled driver NOT identified by the selector.
   *
   * Creates an implicit `describe` block at the top level, instantiates
   * a `Knex` instance, and adds an `after` hook to destroy it when the
   * `describe` block is done.
   *
   * Top-level blocks have their title prefixed with the driver name
   *
   * @throws {Error}
   * @param {SelectorName|SelectorName[]} selector
   * @param {(knex: T, name: DriverName) => void} cb
   */
  except(selector, cb) {
    const group = this._parent?.group ?? this._base;
    this.each(
      /** @type {DriverName[]} */ (group.except(selector).selected()),
      cb
    );
  }

  /* istanbul ignore next: abstract method */
  /**
   * @abstract
   * @protected
   * @param {T} knex
   * @param {DriverName} name
   * @param {(knex: T, name: DriverName) => void} cb
   */
  _filtered(knex, name, cb) {
    throw new Error('Abstract method: implement in subclass');
  }

  /* istanbul ignore next: abstract method */
  /**
   * @abstract
   * @protected
   * @param {string} title
   * @param {T} knex
   * @param {DriverName} name
   * @param {(knex: T, name: DriverName) => void} cb
   */
  _block(title, knex, name, cb) {
    throw new Error('Abstract method: implement in subclass');
  }

  /* istanbul ignore next: abstract method */
  /**
   * @abstract
   * @protected
   * @param {DriverName} driver
   * @returns {T}
   */
  _getKnex(driver) {
    throw new Error('Abstract method: implement in subclass');
  }
}

module.exports = {
  AbstractInstanceProvider,
};
