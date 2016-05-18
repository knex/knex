
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
    this.pushQuery({
      sql: `show tables like ${this.formatter.parameter(tableName)}`,
      output(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn(tableName, column) {
    this.pushQuery({
      sql: `show columns from ${this.formatter.wrap(tableName)}` +
        ' like ' + this.formatter.parameter(column),
      output(resp) {
        return resp.length > 0;
      }
    });
  }

})

export default SchemaCompiler_MySQL;
