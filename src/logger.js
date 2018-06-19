/* eslint no-console:0 */

import chalk from 'chalk';
import {isFunction, isNil} from 'lodash';

function log(message, userFn, colorFn) {
  if(!isNil(userFn) && !isFunction(userFn)) {
    throw new TypeError('Extensions to knex logger must be functions!');
  }

  if(isFunction(userFn)) {
    userFn(message);
    return;
  }

  console.log(colorFn ? colorFn(message) : message);
}

class Logger {
  constructor(config) {
    const {
      log: {
        debug,
        warn,
        error,
        deprecate
      } = {}
    } = config;

    this._debug     = debug;
    this._warn      = warn;
    this._error     = error;
    this._deprecate = deprecate;
  }

  debug(message) {
    log(message, this._debug);
  }

  warn(message) {
    log(message, this._warn,chalk.yellow);
  }

  error(message) {
    log(message, this._error, chalk.red);
  }

  deprecate(method, alternative) {
    const message = `${method} is deprecated, please use ${alternative}`;

    log(message, this._deprecate, chalk.yellow);
  }
}

export default Logger;