// @ts-check

/**
 * @template {string} [T=string]
 * @typedef {((value: any) => any) & {type: T}} CastFn
 */
/**
 * @template {any} [Ctx=undefined]
 * @typedef {(value: any, cast: CastFn, ctx: Ctx) => any} CastCallback
 */
/**
 * @typedef {import('../query/querycompiler').QueryMethod} QueryMethod
 * @typedef {keyof typeof Cast|CastFn} CastValue
 * @typedef {Record<string, CastValue>} CastSpec
 * @typedef {Record<string, CastFn>} ResolvedCastSpec
 * @typedef {(target: any, key: string) => any} Getter
 * @typedef {(target: any, key: string, value: any) => void} Setter
 * @typedef {(target: any, get: Getter, set: Setter) => void} Cast
 * @typedef {(target: any, key: string, ctx?: unknown) => void} ApplyCast
 */

/**
 * Create a function for use with knex.cast() for runtime casting of
 * returned values from the database
 *
 * @template {string} T
 * @param {T} type A string representing the output type. For
 * scalars, this should be equal to `typeof value`. For instances,
 * this should be equal to `value.constructor.name`.
 * @param {(value: any, ctx?: unknown) => any} fn A function that converts the
 * input type to the output type (or throws a TypeError)
 * @returns {CastFn<T>}
 */
const createCastFunction = (type, fn) => Object.assign(fn, { type });

const castSelf = createCastFunction('any', (value) => value);

/**
 * @param {any} value
 * @returns {string}
 */
const describe = (value) => {
  if (value === null) return 'null';
  const type = typeof value;
  if (type !== 'object') return type;
  if (Object.getPrototypeOf(value) === Object.prototype) return 'object';
  return value?.constructor?.name ?? 'object';
};

const castBigInt = createCastFunction('bigint', (value) => {
  switch (typeof value) {
    case 'bigint':
      return value;
    case 'number':
      if (!Number.isInteger(value)) {
        throw new TypeError(`Invalid value (not an integer): ${value}`);
      }
      return BigInt(value);
    case 'string': {
      if (value === '') {
        throw new TypeError(`Invalid value (empty string)`);
      }
      // may throw SyntaxError: Cannot convert <value> to a BigInt
      return BigInt(value);
    }
    default:
      throw new TypeError(`Invalid value (${describe(value)})`);
  }
});

const castNumber = createCastFunction('number', (value) => {
  switch (typeof value) {
    case 'number':
      return value;
    case 'bigint': {
      const num = Number(value);
      if (!Number.isSafeInteger(num)) {
        throw new RangeError(
          `Invalid value (out of safe integer range): ${value}`
        );
      }
      return num;
    }
    case 'string': {
      if (value === '') {
        throw new TypeError(`Invalid value (empty string)`);
      }
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new TypeError(`Invalid value (NaN): ${value}`);
      }
      if (!Number.isFinite(num)) {
        throw new TypeError(`Invalid value (infinity): ${value}`);
      }
      return num;
    }
    default:
      throw new TypeError(`Invalid value (${describe(value)})`);
  }
});

const Cast = /** @type {const} */ {
  number: castNumber,
  bigint: castBigInt,
};

/** @type {(castValue: CastValue, type: string) => boolean} */
const castsTo = (castValue, type) => {
  switch (typeof castValue) {
    case 'function':
      return castValue.type === type;
    case 'string':
      return Cast[castValue]?.type === type;
    default:
      return false;
  }
};

const ObjectProto = Object.prototype;
const hasOwnProperty = ObjectProto.hasOwnProperty;

// pre-generate helper functions for performing safe object access.
//
// getting a property value:
//   when the key exists on Object.prototype:
//     returns undefined if `key` is not an own property, otherwise obj[key]
//   otherwise: returns obj[key]
//
// setting a property value:
//   when the key exists on Object.prototype and has a setter:
//     uses Object.defineProperty() to set the value as an own property
//   otherwise: obj[key] = val
//
// safeGet(obj, key) and safeSet(obj, key, value) call the appropriate
// get / set function directly, at the cost of an extra indirection
const { safeGet, safeSet } = (() => {
  /**
   * Indexed dereference on an object property
   *
   * @type {Getter}
   */
  const get = (target, key) => target[key];

  /**
   * Indexed dereference on an object property, guarded
   * by a hasOwnProperty check
   *
   * @type {Getter}
   */
  const checkedGet = (target, key) =>
    hasOwnProperty.call(target, key) ? target[key] : undefined;

  /**
   * Direct indexed assignment of an object property
   *
   * @type {Setter}
   */
  const set = (target, key, value) => {
    target[key] = value;
  };

  /**
   * Assignment of an object property using Object.defineProperty
   *
   * @type {Setter}
   */
  const carefulSet = (target, key, value) => {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  };

  /** @type {Record<string, any>} */
  const safeSetters = Object.create(null);
  /** @type {Record<string, any>} */
  const safeGetters = Object.create(null);

  // this isn't fully complete; the prototype could be modified, but this
  // covers the __proto__ case and whatever else is on the default Object.prototype
  // as the spec evolves
  for (const [key, descr] of Object.entries(
    Object.getOwnPropertyDescriptors(ObjectProto)
  )) {
    // we never want to get a proto value, only own properties
    safeGetters[key] = checkedGet;

    // we never want to call proto setters, anything else will get shadowed
    if (typeof descr?.set === 'function') {
      safeSetters[key] = carefulSet;
    }
  }

  /**
   * Call the appropriate get function ad-hoc, when the function
   * can't be persisted
   *
   * @type {Getter}
   */
  const safeGet = (target, key) => (safeGetters[key] ?? get)(target, key);

  /**
   * Call the appropriate set function ad-hoc, when the function
   * can't be persisted
   *
   * @type {Setter}
   */
  const safeSet = (target, key, value) =>
    (safeSetters[key] ?? set)(target, key, value);

  return { safeGet, safeSet };
})();

/**
 * Resolve string-valued column casts to their function equivalents
 *
 * @param {CastSpec} spec
 * @returns {ResolvedCastSpec}
 */
const resolveSpec = (spec) => {
  const resolved = Object.create(null);
  for (const [key, val] of Object.entries(spec)) {
    if (typeof val === 'string') {
      if (!hasOwnProperty.call(Cast, val)) {
        throw new TypeError(`Invalid cast type: ${val}`);
      }
      resolved[key] = Cast[val];
    } else if (typeof val === 'function') {
      if (!hasOwnProperty.call(val, 'type') || typeof val.type !== 'string') {
        throw new TypeError(
          `Invalid untagged cast function. Use createCastFunction`
        );
      }
      resolved[key] = val;
    } else {
      throw new TypeError(`Invalid cast value: ${describe(val)}`);
    }
  }
  return resolved;
};

/**
 * @template {any} [Ctx=undefined]
 */
class ResultMapper {
  /** @type {ResolvedCastSpec} */
  spec;

  /** @type {string[]} */
  specCols;

  /** @type {CastCallback<Ctx>|undefined} */
  callback;

  /**
   * @param {CastSpec} spec
   * @param {CastCallback<Ctx>} [callback]
   */
  constructor(spec, callback) {
    this.spec = resolveSpec(spec);
    this.specCols = Object.keys(spec);
    this.callback = callback;
  }

  /**
   * Cast the values of the query result
   *
   * @param {any} result
   * @param {Ctx} ctx
   * @returns {void}
   */
  applyTo(result, ctx) {
    // skip nonsensical results
    if (result == null) return;

    // uniform shape
    const rows = Array.isArray(result) ? result : [result];

    // empty result set - do nothing
    if (rows.length === 0) return;

    const callback = this.callback;
    const spec = this.spec;
    /** @type {string[]} */
    const cols =
      callback === undefined ? Object.keys(this.spec) : Object.keys(rows[0]);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (let j = 0; j < cols.length; j++) {
        const key = /** @type {string} */ (cols[j]);
        const current = safeGet(row, key);

        // don't cast nullish
        if (current == null) continue;

        const cast = spec[key] ?? castSelf;
        safeSet(
          row,
          key,
          callback === undefined ? cast(current) : callback(current, cast, ctx)
        );
      }
    }
  }

  /**
   * @param {string} key
   * @param {any} rows
   * @param {Ctx} ctx
   * @returns {void}
   */
  applyToPlucked(key, rows, ctx) {
    // ignore nonsensical results
    if (rows == null || !Array.isArray(rows)) return;

    // this.spec is a null-prototype object, so "in" is okay here
    const cast = this.spec[key] ?? castSelf;
    const callback = this.callback;

    if (cast === undefined && this.callback === undefined) {
      // no cast behavior defined
      return;
    }

    if (callback) {
      for (let i = 0; i < rows.length; i++) {
        rows[i] = callback(rows[i], cast, ctx);
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        rows[i] = cast(rows[i]);
      }
    }
  }
}

module.exports = {
  Cast,
  createCastFunction,
  castsTo,
  ResultMapper,
  safeGet,
  safeSet,
};
