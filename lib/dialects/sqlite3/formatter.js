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
      return `(${this.parameter(values)})`;
    }

    return this.parameter(values);
  }

  unwrapRaw(value, isParameter) {
    /**
     * underlying driver not support bigint and produces null's instead
     * see https://github.com/mapbox/node-sqlite3/issues/1058
     */
    const mappedValue = typeof value === 'bigint' ? value.toString() : value;
    return super.unwrapRaw(mappedValue, isParameter);
  }
};
