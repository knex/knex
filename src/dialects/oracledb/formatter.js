const inherits = require('inherits');
const Oracle_Formatter = require('../oracle/formatter');
const BlobHelper = require('./utils').BlobHelper;

import {assign} from 'lodash';

function Oracledb_Formatter(client) {
  Oracle_Formatter.call(this, client);
}
inherits(Oracledb_Formatter, Oracle_Formatter);

assign(Oracledb_Formatter.prototype, {

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter: function parameter(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    } else if (value instanceof BlobHelper) {
      return 'EMPTY_BLOB()';
    }
    return this.unwrapRaw(value, true) || '?';
  }

});

module.exports = Oracledb_Formatter;
