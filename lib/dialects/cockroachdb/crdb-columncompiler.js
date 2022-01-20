/* eslint max-len: 0 */

const ColumnCompiler = require('../postgres/schema/pg-columncompiler');

class ColumnCompiler_CRDB extends ColumnCompiler {
  integer() {
    return 'int4';
  }
}

module.exports = ColumnCompiler_CRDB;
