'use strict';

exports.__esModule = true;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint no-console:0 */

function log(message, userFn, colorFn) {
  if (!(0, _lodash.isNil)(userFn) && !(0, _lodash.isFunction)(userFn)) {
    throw new TypeError('Extensions to knex logger must be functions!');
  }

  if ((0, _lodash.isFunction)(userFn)) {
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

    this._debug = debug;
    this._warn = warn;
    this._error = error;
    this._deprecate = deprecate;
  }

  debug(message) {
    log(message, this._debug);
  }

  warn(message) {
    log(message, this._warn, _chalk2.default.yellow);
  }

  error(message) {
    log(message, this._error, _chalk2.default.red);
  }

  deprecate(method, alternative) {
    const message = `${method} is deprecated, please use ${alternative}`;

    log(message, this._deprecate, _chalk2.default.yellow);
  }
}

exports.default = Logger;
module.exports = exports['default'];