// PostgreSQL Spanner Query Builder & Compiler
// ------
const identity = require('lodash/identity');
const reduce = require('lodash/reduce');

const QueryCompiler_PG = require('../../postgres/query/pg-querycompiler');

class QueryCompiler_PgSpanner extends QueryCompiler_PG {
  // Spanner doesn't support current_database(); drop the table_catalog filter.
  columnInfo() {
    const column = this.single.columnInfo;
    let schema = this.single.schema;

    const table = this.client.customWrapIdentifier(this.single.table, identity);

    if (schema) {
      schema = this.client.customWrapIdentifier(schema, identity);
    }

    const sql = 'select * from information_schema.columns where table_name = ?';
    const bindings = [table];

    return this._buildColumnInfoQuery(schema, sql, bindings, column);
  }

  // No current_schema() fallback — Spanner doesn't support it.
  _buildColumnInfoQuery(schema, sql, bindings, column) {
    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema);
    }

    return {
      sql,
      bindings,
      output(resp) {
        const out = reduce(
          resp.rows,
          function (columns, val) {
            columns[val.column_name] = {
              type: val.data_type,
              maxLength: val.character_maximum_length,
              nullable: val.is_nullable === 'YES',
              defaultValue: val.column_default,
            };
            return columns;
          },
          {}
        );
        return (column && out[column]) || out;
      },
    };
  }
}

module.exports = QueryCompiler_PgSpanner;
