const QueryCompiler_PG = require('../postgres/query/pg-querycompiler');
const isEmpty = require('lodash/isEmpty');
const { columnize: columnize_ } = require('../../formatter/wrappingFormatter');

class QueryCompiler_CRDB extends QueryCompiler_PG {
  truncate() {
    return `truncate ${this.tableName}`;
  }

  upsert() {
    let sql = this._upsert();
    if (sql === '') return sql;
    const { returning } = this.single;
    if (returning) sql += this._returning(returning);
    return {
      sql: sql,
      returning,
    };
  }

  _upsert() {
    const upsertValues = this.single.upsert || [];
    const sql = this.with() + `upsert into ${this.tableName} `;
    const body = this._insertBody(upsertValues);
    return body === '' ? '' : sql + body;
  }
}

module.exports = QueryCompiler_CRDB;
