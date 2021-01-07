const Oracle_Formatter = require('../oracle/oracle-formatter');
const { BlobHelper } = require('./utils');
const { outputQuery } = require('../../formatter/wrappingFormatter');
const { compileCallback } = require('../../formatter/formatterUtils');

class Oracledb_Formatter extends Oracle_Formatter {
  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value) {
    if (typeof value === 'function') {
      return outputQuery(
        compileCallback(value, undefined, this.client, this),
        true,
        this.builder,
        this.client,
        this
      );
    } else if (value instanceof BlobHelper) {
      return 'EMPTY_BLOB()';
    }
    return this.unwrapRaw(value, true) || '?';
  }
}

module.exports = Oracledb_Formatter;
