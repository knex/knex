'use strict';

exports.__esModule = true;
exports.normalizeArr = normalizeArr;
exports.containsUndefined = containsUndefined;
exports.addQueryContext = addQueryContext;

var _lodash = require('lodash');

// Check if the first argument is an array, otherwise uses all arguments as an
// array.
function normalizeArr() {
  var args = new Array(arguments.length);
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  if (Array.isArray(args[0])) {
    return args[0];
  }
  return args;
} /* eslint no-console:0 */

function containsUndefined(mixed) {
  var argContainsUndefined = false;

  if ((0, _lodash.isTypedArray)(mixed)) return false;

  if (mixed && (0, _lodash.isFunction)(mixed.toSQL)) {
    //Any QueryBuilder or Raw will automatically be validated during compile.
    return argContainsUndefined;
  }

  if ((0, _lodash.isArray)(mixed)) {
    for (var i = 0; i < mixed.length; i++) {
      if (argContainsUndefined) break;
      argContainsUndefined = this.containsUndefined(mixed[i]);
    }
  } else if ((0, _lodash.isPlainObject)(mixed)) {
    for (var key in mixed) {
      if (mixed.hasOwnProperty(key)) {
        if (argContainsUndefined) break;
        argContainsUndefined = this.containsUndefined(mixed[key]);
      }
    }
  } else {
    argContainsUndefined = (0, _lodash.isUndefined)(mixed);
  }

  return argContainsUndefined;
}

function addQueryContext(Target) {
  // Stores or returns (if called with no arguments) context passed to
  // wrapIdentifier and postProcessResponse hooks
  Target.prototype.queryContext = function (context) {
    if ((0, _lodash.isUndefined)(context)) {
      return this._queryContext;
    }
    this._queryContext = context;
    return this;
  };
}