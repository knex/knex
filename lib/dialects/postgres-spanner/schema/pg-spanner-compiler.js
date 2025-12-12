// PostgreSQL Spanner Schema Compiler
// -------

const SchemaCompiler_PG = require('../../postgres/schema/pg-compiler');

class SchemaCompiler_PgSpanner extends SchemaCompiler_PG {
  constructor(client, builder) {
    super(client, builder);
  }

  // Check whether the current table
  hasTable(tableName) {
    let sql = 'select * from information_schema.tables where table_name = ?';
    const bindings = [tableName];

    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    }

    this.pushQuery({
      sql,
      bindings,
      output(resp) {
        return resp.rows.length > 0;
      },
    });
  }

  // Compile the query to determine if a column exists in a table.
  hasColumn(tableName, columnName) {
    let sql =
      'select * from information_schema.columns where table_name = ? and column_name = ?';
    const bindings = [tableName, columnName];

    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    }

    this.pushQuery({
      sql,
      bindings,
      output(resp) {
        return resp.rows.length > 0;
      },
    });
  }
}

module.exports = SchemaCompiler_PgSpanner;
