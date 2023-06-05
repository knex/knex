// @ts-ignore
import * as SchemaCompiler_MySQL from '../mysql/schema/mysql-compiler';

export class SchemaCompiler extends SchemaCompiler_MySQL {
  constructor(client, builder) {
    super(client, builder);
  }

  // Check whether a table exists on the query.
  hasTable(tableName) {
    const [schema, table] = tableName.includes('.')
      ? tableName.split('.')
      : [undefined, tableName];
    let sql = 'select * from information_schema.tables where table_name = ?';
    const bindings = [table.toUpperCase()];

    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema.toUpperCase());
    } else {
      sql += ' and table_schema = current_schema()';
    }

    // @ts-ignore
    this.pushQuery({
      sql,
      bindings,
      output: (resp) => resp.rows.length > 0,
    });
  }
}
