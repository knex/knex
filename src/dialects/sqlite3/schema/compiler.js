// SQLite3: Column Builder & Compiler
// -------
import SchemaCompiler from '../../../schema/compiler';

import { some } from 'lodash';

// Schema Compiler
// -------

class SchemaCompiler_SQLite3 extends SchemaCompiler {
  // Compile the query to determine if a table exists.
  hasTable(tableName) {
    const sql =
      `select * from sqlite_master ` +
      `where type = 'table' and name = ${this.formatter.parameter(tableName)}`;
    this.pushQuery({ sql, output: (resp) => resp.length > 0 });
  }

  // Compile the query to determine if a column exists.
  hasColumn(tableName, column) {
    this.pushQuery({
      sql: `PRAGMA table_info(${this.formatter.wrap(tableName)})`,
      output(resp) {
        return some(resp, { name: column });
      },
    });
  }

  // Compile a rename table command.
  renameTable(from, to) {
    this.pushQuery(
      `alter table ${this.formatter.wrap(from)} rename to ${this.formatter.wrap(
        to
      )}`
    );
  }
}

export default SchemaCompiler_SQLite3;
