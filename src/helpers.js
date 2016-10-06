/* eslint no-console:0 */

import { map, pick, keys, isFunction, isUndefined, isObject, isArray, isTypedArray } from 'lodash'
import chalk from 'chalk';

// Pick off the attributes from only the current layer of the object.
export function skim(data) {
  return map(data, (obj) => pick(obj, keys(obj)));
}

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

export function debugLog(msg) {
  console.log(msg);
}

export function error(msg) {
  console.log(chalk.red(`Knex:Error ${msg}`))
}

  // Used to signify deprecated functionality.
export function deprecate(method, alternate) {
  warn(`${method} is deprecated, please use ${alternate}`);
}

  // Used to warn about incorrect use, without error'ing
export function warn(msg) {
  console.log(chalk.yellow(`Knex:warning - ${msg}`))
}

export function exit(msg) {
  console.log(chalk.red(msg))
  process.exit(1)
}

export function containsUndefined(mixed) {
  let argContainsUndefined = false;

  if (isTypedArray(mixed))
    return false;

  if(mixed && isFunction(mixed.toSQL)) {
    //Any QueryBuilder or Raw will automatically be validated during compile.
    return argContainsUndefined;
  }

  if(isArray(mixed)) {
    for(let i = 0; i < mixed.length; i++) {
      if(argContainsUndefined) break;
      argContainsUndefined = this.containsUndefined(mixed[i]);
    }
  } else if(isObject(mixed)) {
    for(const key in mixed) {
      if(argContainsUndefined) break;
      argContainsUndefined = this.containsUndefined(mixed[key]);
    }
  } else {
    argContainsUndefined = isUndefined(mixed);
  }

  return argContainsUndefined;
}