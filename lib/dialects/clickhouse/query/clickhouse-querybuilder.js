const QueryBuilder = require('../../../query/querybuilder');

module.exports = class QueryBuilder_Сlickhouse extends QueryBuilder {
  limit(values) {
    return super.limit(values, true);
  }

  offset(values) {
    return super.offset(values, true);
  }
};
