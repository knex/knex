exports.isString = function isString(value) {
  return typeof value === 'string';
};

exports.isNumber = function isNumber(value) {
  return typeof value === 'number';
};

exports.isBoolean = function isBoolean(value) {
  return typeof value === 'boolean';
};

exports.isUndefined = function isUndefined(value) {
  return typeof value === 'undefined';
};

exports.isObject = function isObject(value) {
  return typeof value === 'object' && value !== null;
};

exports.isFunction = function isFunction(value) {
  return typeof value === 'function';
};
