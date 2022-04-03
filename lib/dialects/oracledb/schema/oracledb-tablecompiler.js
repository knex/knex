const TableCompiler_Oracle = require('../../oracle/schema/oracle-tablecompiler');

class TableCompiler_Oracledb extends TableCompiler_Oracle {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  _setNullableState(column, isNullable) {
    const nullability = isNullable ? 'NULL' : 'NOT NULL';
    const sql = `alter table ${this.tableName()} modify (${this.formatter.wrap(
      column
    )} ${nullability})`;
    return this.pushQuery({
      sql: sql,
    });
  }
}

module.exports = TableCompiler_Oracledb;
