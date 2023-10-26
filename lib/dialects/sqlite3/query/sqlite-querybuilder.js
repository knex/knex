const QueryBuilder = require('../../../query/querybuilder.js');

module.exports = class QueryBuilder_SQLite3 extends QueryBuilder {
  withMaterialized(alias, statementOrColumnList, nothingOrStatement) {
    this._validateWithArgs(
      alias,
      statementOrColumnList,
      nothingOrStatement,
      'with'
    );
    return this.withWrapped(
      alias,
      statementOrColumnList,
      nothingOrStatement,
      true
    );
  }

  withNotMaterialized(alias, statementOrColumnList, nothingOrStatement) {
    this._validateWithArgs(
      alias,
      statementOrColumnList,
      nothingOrStatement,
      'with'
    );
    return this.withWrapped(
      alias,
      statementOrColumnList,
      nothingOrStatement,
      false
    );
  }
};
