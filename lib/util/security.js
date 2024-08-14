/**
 * Sets a hidden (non-enumerable) property on the `target` object, copying it
 * from `source`.
 *
 * This is useful when we want to protect certain data from being accidentally
 * leaked through logs, also when the property is non-enumerable on the `source`
 * object and we want to ensure that it is properly copied.
 *
 * @param {object} target
 * @param {object} source - default: target
 * @param {string} propertyName - default: 'password'
 */
function setHiddenProperty(target, source, propertyName = 'password') {
  if (!source) {
    source = target;
  }

  Object.defineProperty(target, propertyName, {
    enumerable: false,
    value: source[propertyName],
  });
}

module.exports = {
  setHiddenProperty,
};
