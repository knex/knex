const Raw = require('../../raw');
const TYPES = require('./types');

class Val extends Raw {
  set(value, type) {
    if (!TYPES.includes(type)) {
      throw new Error(`The type ${type} does not support.`);
    }

    return super.set(`{?:${type}}`, [value]);
  }
}

module.exports = Val;
