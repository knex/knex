'use strict';

exports.__esModule = true;

var _isTypedArray2 = require('lodash/isTypedArray');

var _isTypedArray3 = _interopRequireDefault(_isTypedArray2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _isObject2 = require('lodash/isObject');

var _isObject3 = _interopRequireDefault(_isObject2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

exports.skim = skim;
exports.normalizeArr = normalizeArr;
exports.debugLog = debugLog;
exports.error = error;
exports.deprecate = deprecate;
exports.warn = warn;
exports.exit = exit;
exports.containsUndefined = containsUndefined;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Pick off the attributes from only the current layer of the object.
function skim(data) {
  return (0, _map3.default)(data, function (obj) {
    return (0, _pick3.default)(obj, (0, _keys3.default)(obj));
  });
}

// Check if the first argument is an array, otherwise uses all arguments as an
// array.
/* eslint no-console:0 */

function normalizeArr() {
  var args = new Array(arguments.length);
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  if (Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

function debugLog(msg) {
  console.log(msg);
}

function error(msg) {
  console.log(_chalk2.default.red('Knex:Error ' + msg));
}

// Used to signify deprecated functionality.
function deprecate(method, alternate) {
  warn(method + ' is deprecated, please use ' + alternate);
}

// Used to warn about incorrect use, without error'ing
function warn(msg) {
  console.log(_chalk2.default.yellow('Knex:warning - ' + msg));
}

function exit(msg) {
  console.log(_chalk2.default.red(msg));
  process.exit(1);
}

function containsUndefined(mixed) {
  var argContainsUndefined = false;

  if ((0, _isTypedArray3.default)(mixed)) return false;

  if (mixed && (0, _isFunction3.default)(mixed.toSQL)) {
    //Any QueryBuilder or Raw will automatically be validated during compile.
    return argContainsUndefined;
  }

  if ((0, _isArray3.default)(mixed)) {
    for (var i = 0; i < mixed.length; i++) {
      if (argContainsUndefined) break;
      argContainsUndefined = this.containsUndefined(mixed[i]);
    }
  } else if ((0, _isObject3.default)(mixed)) {
    for (var key in mixed) {
      if (argContainsUndefined) break;
      argContainsUndefined = this.containsUndefined(mixed[key]);
    }
  } else {
    argContainsUndefined = (0, _isUndefined3.default)(mixed);
  }

  return argContainsUndefined;
}