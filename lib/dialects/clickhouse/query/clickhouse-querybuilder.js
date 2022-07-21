const QueryBuilder = require('../../../query/querybuilder');

module.exports = class QueryBuilder_Clickhouse extends QueryBuilder {
  limit(value) {
    return super.limit(value, true);
  }

  offset(value) {
    return super.offset(value, true);
  }

  delete(ret, options) {
    throw new Error(
      `Delete is not yet supported for dialect ${this.client.dialect}`
    );
  }

  update(ret, options) {
    throw new Error(
      `Delete is not yet supported for dialect ${this.client.dialect}`
    );
  }
};
