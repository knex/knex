const TYPES = require('./types');

class Val {
  constructor() {
    this.value = null;
    this.type = null;
  }

  set(value, type, checkType = true) {
    checkType && this._checkType(type);
    this.value = value;
    this.type = type;
    return this;
  }

  _checkType(type) {
    const [firstPart] = type.split('(');
    if (!TYPES.includes(firstPart)) {
      throw new Error(`The type ${type} does not support.`);
    }
  }
}

module.exports = Val;
