// MySQL Schema Compiler
// -------
import { SchemaCompiler } from '../../../schema/compiler';

export class SchemaCompiler_MySQL extends SchemaCompiler {
  // Rename a table on the schema.
  renameTable(tableName, to) {
    this.pushQuery(
      `rename table ${this.formatter.wrap(tableName)} to ${this.formatter.wrap(
        to
      )}`
    );
  }

  // Check whether a table exists on the query.
  hasTable(tableName) {
    let sql = 'select * from information_schema.tables where table_name = ?';
    const bindings = [tableName];

    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    } else {
      sql += ' and table_schema = database()';
    }

    this.pushQuery({
      sql,
      bindings,
      output: function output(resp) {
        return resp.length > 0;
      },
    });
  }

  // Check whether a column exists on the schema.
  hasColumn(tableName, column) {
    this.pushQuery({
      sql:
        `show columns from ${this.formatter.wrap(tableName)}` +
        ' like ' +
        this.formatter.parameter(column),
      output(resp) {
        return resp.length > 0;
      },
    });
  }
}

export default SchemaCompiler_MySQL;
