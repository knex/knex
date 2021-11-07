const QueryBuilder = require('../../../query/querybuilder.js');

module.exports = class QueryBuilder_PostgreSQL extends QueryBuilder {
  using(tables) {
    this._single.using = tables;
    return this;
  }
};
