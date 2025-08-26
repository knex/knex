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

function isNull(value) {
  return value === null;
}

function isDate(value) {
  return value instanceof Date;
}

function isPlainObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isPrimitive(value) {
  return (
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isNull(value) ||
    (isDate(value) && value.toJSON === Date.prototype.toJSON)
  );
}

function isSafeObject(value) {
  if (!isPlainObject(value)) return false;
  
  return Object.values(value).every(isPrimitive);
}

function isSafeArray(value) {
  if (!Array.isArray(value)) return false;
  
  return value.every(isPrimitive);
}

function isSafeValue(value) {
  if (isPlainObject(value)) {
    return isSafeObject(value);
  }
  if (Array.isArray(value)) {
    return isSafeArray(value);
  }
  return isPrimitive(value);
}

module.exports = {
  isString,
  isNumber,
  isBoolean,
  isUndefined,
  isObject,
  isFunction,
  isNull,
  isDate,
  isPlainObject,
  isPrimitive,
  isSafeObject,
  isSafeArray,
  isSafeValue,
};