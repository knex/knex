'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

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

var Logger = function () {
  function Logger(config) {
    (0, _classCallCheck3.default)(this, Logger);
    var _config$log = config.log;
    _config$log = _config$log === undefined ? {} : _config$log;
    var debug = _config$log.debug,
        warn = _config$log.warn,
        error = _config$log.error,
        deprecate = _config$log.deprecate;


    this._debug = debug;
    this._warn = warn;
    this._error = error;
    this._deprecate = deprecate;
  }

  Logger.prototype.debug = function debug(message) {
    log(message, this._debug);
  };

  Logger.prototype.warn = function warn(message) {
    log(message, this._warn, _chalk2.default.yellow);
  };

  Logger.prototype.error = function error(message) {
    log(message, this._error, _chalk2.default.red);
  };

  Logger.prototype.deprecate = function deprecate(method, alternative) {
    var message = method + ' is deprecated, please use ' + alternative;

    log(message, this._deprecate, _chalk2.default.yellow);
  };

  return Logger;
}();

exports.default = Logger;
module.exports = exports['default'];