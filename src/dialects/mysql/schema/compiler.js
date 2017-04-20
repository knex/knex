
// MySQL Schema Compiler
// -------
import inherits from 'inherits';
import SchemaCompiler from '../../../schema/compiler';

import { assign } from 'lodash'

function SchemaCompiler_MySQL(client, builder) {
  SchemaCompiler.call(this, client, builder)
}
inherits(SchemaCompiler_MySQL, SchemaCompiler)

assign(SchemaCompiler_MySQL.prototype, {

  // Rename a table on the schema.
  renameTable(tableName, to) {
    this.pushQuery(`rename table ${this.formatter.wrap(tableName)} to ${this.formatter.wrap(to)}`);
  },

  // Check whether a table exists on the query.
  hasTable(tableName) {
    const sql = [`select * from information_schema.tables`];
    const bindings = [];

    if (this.schema) {
      sql.push(`where schema_name = ? and table_name = ?`);
      bindings.push(this.schema, tableName);
    } else {
      sql.push(
        `where concat_ws('.', table_schema, table_name)`,
        `in (concat_ws('.', database(), ?), ?)`
      );
      bindings.push(tableName, tableName);
    }
    this.pushQuery({
      sql: sql.join(' '),
      bindings,
      output(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn(tableName, column) {
    const sql = [`select * from information_schema.columns`];
    const bindings = []

    if (this.schema) {
      sql.push(`where schema_name = ? and table_name = ?`);
      bindings.push(this.schema, tableName);
    } else {
      sql.push(
        `where concat_ws('.', table_schema, table_name)`,
        `in (concat_ws('.', database(), ?), ?)`
      );
      bindings.push(tableName, tableName);
    }
    sql.push(`and column_name = ?`)
    bindings.push(column)
    this.pushQuery({
      sql: sql.join(' '),
      bindings,
      output(resp) {
        return resp.length > 0;
      }
    });
  }

})

export default SchemaCompiler_MySQL;
