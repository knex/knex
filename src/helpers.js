/* eslint no-console:0 */

import {
  map, pick, keys, isFunction, isUndefined,
  isObject, isTypedArray
} from 'lodash'

// Pick off the attributes from only the current layer of the object.
export function skim(data) {
  return map(data, (obj) => pick(obj, keys(obj)));
}

// Check if the first argument is an array, otherwise uses all arguments as an array.
export function normalizeArr(...args) {
  if (Array.isArray(args[0])) {
    return args[0]
  }
  return args;
}

// Used to signify deprecated functionality.
export function deprecate(method, alternate) {
  return `${method} is deprecated, please use ${alternate}`
}

export function containsUndefined(mixed) {
  let argContainsUndefined = false;

  if (isTypedArray(mixed)) {
    return false;
  }

  if (mixed && isFunction(mixed.toSQL)) {
    // Any QueryBuilder or Raw will automatically be validated during compile.
    return argContainsUndefined;
  }

  if (Array.isArray(mixed)) {
    for (let i = 0; i < mixed.length; i++) {
      if (argContainsUndefined) break;
      argContainsUndefined = containsUndefined(mixed[i]);
    }
  } else if (isObject(mixed)) {
    for (const key in mixed) {
      if(argContainsUndefined) break;
      argContainsUndefined = containsUndefined(mixed[key]);
    }
  } else {
    argContainsUndefined = isUndefined(mixed);
  }

  return argContainsUndefined;
}
