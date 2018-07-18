// PostgreSQL Query Builder & Compiler
// ------
import inherits from 'inherits';

import QueryCompiler from '../../../query/compiler';

import { assign, reduce, identity } from 'lodash';

function QueryCompiler_PG(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_PG, QueryCompiler);

assign(QueryCompiler_PG.prototype, {
  // Compiles a truncate query.
  truncate() {
    return `truncate ${this.tableName} restart identity`;
  },

  // is used if the an array with multiple empty values supplied
  _defaultInsertValue: 'default',

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const sql = QueryCompiler.prototype.insert.call(this);
    if (sql === '') return sql;
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning,
    };
  },

  // Compiles an `update` query, allowing for a return value.
  update() {
    const updateData = this._prepUpdate(this.single.update);
    const wheres = this.where();
    const { returning } = this.single;
    return {
      sql:
        this.with() +
        `update ${this.single.only ? 'only ' : ''}${this.tableName} ` +
        `set ${updateData.join(', ')}` +
        (wheres ? ` ${wheres}` : '') +
        this._returning(returning),
      returning,
    };
  },

  // Compiles an `update` query, allowing for a return value.
  del() {
    const sql = QueryCompiler.prototype.del.apply(this, arguments);
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning,
    };
  },

  aggregate(stmt) {
    return this._aggregate(stmt, { distinctParentheses: true });
  },

  _returning(value) {
    return value ? ` returning ${this.formatter.columnize(value)}` : '';
  },

  forUpdate() {
    return 'for update';
  },

  forShare() {
    return 'for share';
  },

  // Compiles a columnInfo query
  columnInfo() {
    const column = this.single.columnInfo;
    let schema = this.single.schema;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    if (schema) {
      schema = this.client.customWrapIdentifier(schema, identity);
    }

    let sql =
      'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    const bindings = [table, this.client.database()];

    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    return {
      sql,
      bindings,
      output(resp) {
        const out = reduce(
          resp.rows,
          function(columns, val) {
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
  },
});

export default QueryCompiler_PG;
