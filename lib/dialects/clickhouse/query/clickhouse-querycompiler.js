// Сlickhouse Query Compiler
// ------
const QueryCompiler = require('../../../query/querycompiler');
const isEmpty = require('lodash/isEmpty');
const {
  columnize: columnize_,
} = require('../../../formatter/wrappingFormatter');

class QueryCompiler_Сlickhouse extends QueryCompiler {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);

    const { onConflict } = this.single;
    if (onConflict) {
      throw new Error('.onConflict() is not supported for clickhouse.');
    }
  }

  insert() {
    const insertValues = this.single.insert || [];
    let sql = this.with() + `insert into ${this.tableName} `;
    const { returning } = this.single;
    const returningSql = returning
      ? this._returning('insert', returning) + ' '
      : '';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning,
      };
    }

    const { columns, values: insertData } = this._prepInsert(insertValues);

    if (columns.length) {
      sql += `(${columnize_(
        columns,
        this.builder,
        this.client,
        this.bindingsHolder
      )}`;
      sql += ')';
    }

    return {
      sql,
      returning,
      insertData,
    };
  }
}

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_Сlickhouse;
