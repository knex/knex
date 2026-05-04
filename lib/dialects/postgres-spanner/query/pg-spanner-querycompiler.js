// PostgreSQL Query Builder & Compiler
// ------
const reduce = require('lodash/reduce');

const QueryCompiler_PG = require('../../postgres/query/pg-querycompiler');

class QueryCompiler_PgSpanner extends QueryCompiler_PG {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);
  }

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
