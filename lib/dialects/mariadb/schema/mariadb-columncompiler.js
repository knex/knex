// MariaDB Column Compiler
// -------
const ColumnCompiler_MySQL = require('../../mysql/schema/mysql-columncompiler');

class ColumnCompiler_MariaDB extends ColumnCompiler_MySQL {
  // MariaDB does not accept a named CHECK constraint inline in a column
  // definition
  _check(checkPredicate, constraintName) {
    if (constraintName && this.columnBuilder._method !== 'alter') {
      this._pushAlterCheckQuery(checkPredicate, constraintName);
      return '';
    }
    return super._check(checkPredicate, constraintName);
  }
}

module.exports = ColumnCompiler_MariaDB;
