const QueryBuilder = require('../../../query/querybuilder');
const isEmpty = require('lodash/isEmpty');

module.exports = class QueryBuilder_MySQL extends QueryBuilder {
  upsert(values, returning, options) {
    this._method = 'upsert';
    if (!isEmpty(returning)) {
      this.returning(returning, options);
    }

    this._single.upsert = values;
    return this;
  }
};
