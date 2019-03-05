/* eslint no-console:0 */

import {
  isFunction,
  isUndefined,
  isPlainObject,
  isArray,
  isTypedArray,
} from 'lodash';
import { CLIENT_ALIASES } from './constants';

// Check if the first argument is an array, otherwise uses all arguments as an
// array.
export function normalizeArr() {
  const args = new Array(arguments.length);
  for (let i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  if (Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

export function containsUndefined(mixed) {
  let argContainsUndefined = false;

  if (isTypedArray(mixed)) return false;

  if (mixed && isFunction(mixed.toSQL)) {
    //Any QueryBuilder or Raw will automatically be validated during compile.
    return argContainsUndefined;
  }

  if (isArray(mixed)) {
    for (let i = 0; i < mixed.length; i++) {
      if (argContainsUndefined) break;
      argContainsUndefined = this.containsUndefined(mixed[i]);
    }
  } else if (isPlainObject(mixed)) {
    for (const key in mixed) {
      if (mixed.hasOwnProperty(key)) {
        if (argContainsUndefined) break;
        argContainsUndefined = this.containsUndefined(mixed[key]);
      }
    }
  } else {
    argContainsUndefined = isUndefined(mixed);
  }

  return argContainsUndefined;
}

export function addQueryContext(Target) {
  // Stores or returns (if called with no arguments) context passed to
  // wrapIdentifier and postProcessResponse hooks
  Target.prototype.queryContext = function(context) {
    if (isUndefined(context)) {
      return this._queryContext;
    }
    this._queryContext = context;
    return this;
  };
}

export function resolveClientNameWithAliases(clientName) {
  return CLIENT_ALIASES[clientName] || clientName;
}
