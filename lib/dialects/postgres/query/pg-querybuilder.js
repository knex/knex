const QueryBuilder = require('../../../query/querybuilder.js');

module.exports = class QueryBuilder_PostgreSQL extends QueryBuilder {
  updateFrom(name) {
    this._single.updateFrom = name;
    return this;
  }

  using(tables) {
    this._single.using = tables;
    return this;
  }

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
