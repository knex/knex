// Firebird Schema Compiler
// -------
import inherits from 'inherits';
import SchemaCompiler from '../../../schema/compiler';

import { assign } from 'lodash';

function SchemaCompiler_Firebird(client, builder) {
  SchemaCompiler.call(this, client, builder);
}
inherits(SchemaCompiler_Firebird, SchemaCompiler);

assign(SchemaCompiler_Firebird.prototype, {
  dropTablePrefix: 'DROP TABLE ',
  dropTableIfExists(tableName) {
    const queryDrop =
      'execute block ' +
      'as ' +
      'begin ' +
      "  if (exists(select 1 from RDB$RELATION_FIELDS where RDB$SYSTEM_FLAG=0 AND RDB$RELATION_NAME = UPPER('" +
      tableName +
      "'))) then " +
      `    execute statement 'drop table ${tableName}' ` +
      '      WITH AUTONOMOUS TRANSACTION; ' +
      'end;';

    this.pushQuery(queryDrop);
  },
  // Rename a table on the schema.
  renameTable(tableName, to) {
    this.client.logger.warn('Rename table not available for Firebird');
  },

  // Check whether a table exists on the query.
  hasTable(tableName) {
    this.pushQuery({
      sql: `select trim(rdb$relation_name)
        from rdb$relations
        where trim(rdb$relation_name) like ? and rdb$view_blr is null and (rdb$system_flag is null or rdb$system_flag = 0);`,
      bindings: [this.formatter.parameter(tableName)],
      output: function output(resp) {
        return resp.length > 0;
      },
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: `
      SELECT
        TRIM(R.RDB$RELATION_NAME) AS RELATION_NAME, 
        TRIM(R.RDB$FIELD_NAME) AS FIELD_NAME
      FROM RDB$RELATION_FIELDS R WHERE TRIM(R.RDB$RELATION_NAME) LIKE ? and TRIM(R.RDB$FIELD_NAME) like ?`,
      bindings: [
        this.formatter.wrap(tableName),
        this.formatter.parameter(column),
      ],
      output: function output(resp) {
        return resp.length > 0;
      },
    });
  },
});

export default SchemaCompiler_Firebird;
