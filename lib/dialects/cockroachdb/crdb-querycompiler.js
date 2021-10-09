const QueryCompiler_PG = require('../postgres/query/pg-querycompiler');

class QueryCompiler_CRDB extends QueryCompiler_PG {
  truncate() {
    return `truncate ${this.tableName}`;
  }
}

module.exports = QueryCompiler_CRDB;
