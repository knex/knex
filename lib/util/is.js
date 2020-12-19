function isString(value) {
  return typeof value === 'string';
}

function isNumber(value) {
  return typeof value === 'number';
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function isUndefined(value) {
  return typeof value === 'undefined';
}

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isFunction(value) {
  return typeof value === 'function';
}

module.exports = {
  isString,
  isNumber,
  isBoolean,
  isUndefined,
  isObject,
  isFunction,
};
