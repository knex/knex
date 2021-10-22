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
    let sql = this.with() + `upsert into ${this.tableName} `;
    if (Array.isArray(upsertValues)) {
      if (upsertValues.length === 0) return '';
    } else if (typeof upsertValues === 'object' && isEmpty(upsertValues)) {
      return sql + this._emptyInsertValue;
    }

    const upsertData = this._prepInsert(upsertValues);
    if (typeof upsertData === 'string') {
      sql += upsertData;
    } else {
      if (upsertData.columns.length) {
        sql += `(${columnize_(
          upsertData.columns,
          this.builder,
          this.client,
          this.bindingsHolder
        )}`;
        sql += ') values (';
        let i = -1;
        while (++i < upsertData.values.length) {
          if (i !== 0) sql += '), (';
          sql += this.client.parameterize(
            upsertData.values[i],
            this.client.valueForUndefined,
            this.builder,
            this.bindingsHolder
          );
        }
        sql += ')';
      } else if (upsertValues.length === 1 && upsertValues[0]) {
        sql += this._emptyInsertValue;
      } else {
        sql = '';
      }
    }
    return sql;
  }
}

module.exports = QueryCompiler_CRDB;
