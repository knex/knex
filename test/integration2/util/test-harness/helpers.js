// @ts-check

const HOP = Object.prototype.hasOwnProperty;
const { DRIVER_NAMES: ENUM_DRIVERS } = require('../../../../lib/constants');

const DRIVER_NAMES = Object.freeze(Object.values(ENUM_DRIVERS));
/** @typedef {typeof DRIVER_NAMES[number]} DriverName */

/**
 * Return true if the argument is a driver name, otherwise false
 * @param {string} name
 * @returns {name is DriverName}
 */
function isDriverName(name) {
  return /** @type {string[]} */ (DRIVER_NAMES).includes(name);
}

/**
 * Returns an array of its arguments. Asserts that the values are
 * valid database client names.
 *
 * @param  {...DriverName} drivers
 * @returns {readonly DriverName[]}
 */
const DRIVER_GROUP = (...drivers) => assertValidDrivers(drivers);

/**
 * Some tests target a backend via any client. This object defines
 * which clients to use when selecting a group of clients by its
 * backend.
 */
const DRIVER_GROUPS = Object.freeze({
  'mysql~': DRIVER_GROUP('mysql', 'mysql2'),
  'sqlite~': DRIVER_GROUP('sqlite3', 'better-sqlite3'),
  'pg~': DRIVER_GROUP('pg', 'pgnative'),
  'pglike~': DRIVER_GROUP('pg', 'pgnative', 'pg-redshift', 'cockroachdb'),
});

/** @typedef {keyof typeof DRIVER_GROUPS} DriverGroupName */

/**
 * Return true if the argument is a driver group literal, otherwise false
 *
 * @param {string} name
 * @returns {name is DriverGroupName}
 */
function isDriverGroupName(name) {
  return name.endsWith('~') && HOP.call(DRIVER_GROUPS, name);
}

/**
 * Asserts that `drivers` is a non-empty array of valid DriverName strings
 *
 * @throws {Error}
 * @param {any} drivers
 * @returns {readonly DriverName[]}
 */
function assertValidDrivers(drivers) {
  if (!Array.isArray(drivers)) {
    throw errorWithProps('Invalid driver(s): not an array', {
      drivers,
    });
  }

  if (drivers.length === 0) {
    throw errorWithProps('Invalid driver(s): empty array', {});
  }

  // we don't have to check strings directly, any non-string won't
  // pass `isDriverName`
  if (drivers.every(isDriverName)) {
    return Object.freeze(drivers.slice());
  }

  const invalid = drivers.filter((driver) => !isDriverName(driver));
  throw errorWithProps(`Invalid driver(s): ${invalid.join(', ')}`, {
    drivers,
    invalid,
    supported: DRIVER_NAMES,
  });
}

/** @typedef {keyof typeof DRIVER_GROUPS|typeof DRIVER_NAMES[number]} SelectorName */
/** @typedef {'*'|SelectorName|SelectorName[]} DriverSelector */

/** @type {unique symbol} */
const symUninitialized = Symbol('uninitialized');

/** @type {unique symbol} */
const symDestroy = Symbol('destroy');

const noop = () => {};

/**
 * Lazy thunk for a Knex instance
 *
 * Can be destroyed to prevent use without ever instantiating in the first place,
 * solving the circular dependency problem of proactively "instantiating" a knex
 * instance to pass into test blocks but not being able to use an "after" hook
 * to clean them up, while ensuring the lazy instances are safe from being taken
 * out of the scope where they were defined
 *
 * @template T
 * @param {() => T} init
 * @returns {T}
 */
function lazy(init) {
  /** @type {T | typeof symUninitialized} */
  let inst = symUninitialized;
  let destroyed = false;
  const destroy = () => {
    destroyed = true;
  };

  return new Proxy(/** @type {any} */ (noop), {
    apply(_t, thisArg, argArray) {
      if (destroyed) {
        throw new Error('Function call on out-of-scope lazy object');
      }
      // call the factory to get the actual instance and forward any
      // property accesses along
      if (inst === symUninitialized) inst = init();

      return /** @type {Function} */ (inst).apply(thisArg, argArray);
    },
    get(_t, prop) {
      // private symbol exists only in this file, shouldn't ever interfere
      // with anything on the knex object proper
      if (prop === symDestroy) return destroy;
      if (destroyed) {
        throw new Error('Property access on out-of-scope lazy object');
      }

      // call the factory to get the actual instance and forward any
      // property accesses along
      if (inst === symUninitialized) inst = init();
      const value = /** @type {any} */ (inst)[prop];
      return typeof value === 'function' ? value.bind(inst) : value;
    },
  });
}

/**
 * Destroy a lazy-initialized knex proxy so that it can't be used
 * out of scope.
 *
 * @param {any} proxy
 * @returns {void}
 */
const destroyLazy = (proxy) => proxy[symDestroy]();

/**
 * Given a selector or array of selectors, return an array of DriverNames
 * present in the parent (if specified).
 *
 * Selector is invalid if:
 * - single driver names are not members of the parent set
 * - none of the members of a driver group are a member of the parent set
 *
 * @throws {Error} Throws if a selector is invalid
 * @param {string|string[]} selector
 * @param {DriverName[]|readonly DriverName[]} [parent]
 * @returns {DriverName[]}
 */
const expandDriverGroups = (selector, parent = DRIVER_NAMES) => {
  /** @type {DriverName[]} */
  const drivers = [];

  const errors = [];

  if (selector === '*') {
    Array.prototype.push.apply(drivers, /** @type {DriverName[]} */ (parent));
  } else {
    const arr = Array.isArray(selector) ? selector : [selector];
    for (const item of arr) {
      if (isDriverGroupName(item)) {
        const present = DRIVER_GROUPS[item].filter((name) =>
          parent.includes(name)
        );
        if (present.length > 0) {
          Array.prototype.push.apply(drivers, present);
        } else {
          errors.push([item, 'has no members in common with the parent set']);
        }
      } else if (isDriverName(item)) {
        if (parent.includes(item)) {
          drivers.push(item);
        } else {
          errors.push([item, 'is not in parent set']);
        }
      } else {
        errors.push([item, 'is not a valid driver name or driver group name']);
      }
    }
  }

  if (errors.length > 0) {
    const names = errors.map(([name]) => name).join(', ');
    const msgs = errors.map(([name, msg]) => `${name} ${msg}`);
    throw errorWithProps(`Invalid selector(s): ${names}`, {
      selector,
      invalid: msgs,
      parent,
    });
  }

  if (drivers.length === 0) {
    throw errorWithProps('Invalid selector(s): Empty selector', { selector });
  }

  return [...new Set(drivers)];
};

/**
 * Given a selector or array of selectors, return an array of DriverNames
 * NOT present in the parent.
 *
 * Selector is invalid if:
 * - single driver names are not members of the parent set
 * - none of the members of a driver group are a member of the parent set
 * - the filtered set is empty
 *
 * @throws {Error} Throws if a selector is invalid, or the result set is empty
 * @param {DriverSelector} selector
 * @param {DriverName[]|readonly DriverName[]} parent
 * @returns {DriverName[]}
 */
const excludeDriverGroups = (selector, parent) => {
  const expanded = expandDriverGroups(selector, parent);
  const filtered = parent.filter((name) => !expanded.includes(name));
  if (filtered.length === 0) {
    throw errorWithProps(
      'Invalid selector(s): excluded all drivers from the parent set',
      {
        selector,
        parent,
      }
    );
  }
  return filtered;
};

/**
 * Create a base error with data properties
 *
 * @param {string} message
 * @param {object} props
 * @returns {Error}
 */
const errorWithProps = (message, props) => {
  /** @type {any} */
  const err = new Error(message);
  Object.assign(err, props);
  return err;
};

module.exports = {
  ENUM_DRIVERS,
  DRIVER_NAMES,
  DRIVER_GROUPS,
  isDriverName,
  isDriverGroupName,
  assertValidDrivers,
  expandDriverGroups,
  excludeDriverGroups,
  lazy,
  destroyLazy,
  errorWithProps,
};
