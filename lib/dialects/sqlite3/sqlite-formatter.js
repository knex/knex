const Formatter = require('../../formatter');
const Raw = require('../../raw');

module.exports = class SQlite3_Formatter extends Formatter {
  values(values) {
    if (Array.isArray(values)) {
      if (Array.isArray(values[0])) {
        return `( values ${values
          .map((value) => `(${this.parameterize(value)})`)
          .join(', ')})`;
      }
      return `(${this.parameterize(values)})`;
    }

    if (values instanceof Raw) {
      return `(${this.client.parameter(values, this.builder, this)})`;
    }

    return this.client.parameter(values, this.builder, this);
  }
};
