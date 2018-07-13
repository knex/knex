// MySQL Schema Compiler
// -------
import { SchemaCompiler } from '../../../schema/compiler';

export class SchemaCompiler_MSSQL extends SchemaCompiler {
  dropTablePrefix = 'DROP TABLE ';

  dropTableIfExists(tableName) {
    const name = this.formatter.wrap(prefixedTableName(this.schema, tableName));
    this.pushQuery(
      `if object_id('${name}', 'U') is not null DROP TABLE ${name}`
    );
  }

  // Rename a table on the schema.
  renameTable(tableName, to) {
    this.pushQuery(
      `exec sp_rename ${this.formatter.parameter(
        prefixedTableName(this.schema, tableName)
      )}, ${this.formatter.parameter(to)}`
    );
  }

  // Check whether a table exists on the query.
  hasTable(tableName) {
    const formattedTable = this.formatter.parameter(
      this.formatter.wrap(prefixedTableName(this.schema, tableName))
    );

    const sql =
      `select object_id from sys.tables ` +
      `where object_id = object_id(${formattedTable})`;
    this.pushQuery({ sql, output: (resp) => resp.length > 0 });
  }

  // Check whether a column exists on the schema.
  hasColumn(tableName, column) {
    const formattedColumn = this.formatter.parameter(column);
    const formattedTable = this.formatter.parameter(
      this.formatter.wrap(prefixedTableName(this.schema, tableName))
    );
    const sql =
      `select object_id from sys.columns ` +
      `where name = ${formattedColumn} ` +
      `and object_id = object_id(${formattedTable})`;
    this.pushQuery({ sql, output: (resp) => resp.length > 0 });
  }
}

function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}

export default SchemaCompiler_MSSQL;
