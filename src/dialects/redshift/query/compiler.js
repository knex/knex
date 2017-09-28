
// Redshift Query Builder & Compiler
// ------
import inherits from 'inherits';

import QueryCompiler from '../../../query/compiler';
import QueryCompiler_PG from '../../postgres/query/compiler';
import * as helpers from '../../../helpers';

import { assign, reduce } from 'lodash';

function ReturningHelper(columnName) {
  this.columnName = columnName;
}

function QueryCompiler_Redshift(client, builder) {
  QueryCompiler_PG.call(this, client, builder);
}
inherits(QueryCompiler_Redshift, QueryCompiler_PG);

assign(QueryCompiler_Redshift.prototype, {
  truncate() {
    return `truncate ${this.tableName.toLowerCase()}`;
  },

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const sql = QueryCompiler.prototype.insert.call(this)
    if (sql === '') return sql;
    const { returning } = this.single;
    const res = {
      sql: sql,
      returning,
    };
    if (returning) {
      res.returningSql = this._returning(returning);
    }
    return res;
  },

  forUpdate() {
    helpers.warn('table lock is not supported by redshift dialect');
    return '';
  },

  forShare() {
    helpers.warn('lock for share is not supported by redshift dialect');
    return '';
  },

  _returning(value) {
    if (!value) { return ''; }
    const vals = /\*/.test(value) ? '"*"' : this.formatter.columnize(value);
    const desc = /\*/.test(value) ? '"id" DESC ' : Array.isArray(value) ? this.formatter.columnize(value).split(", ").map(v => v + " DESC").join() : value + " DESC";
    const tbl = this.tableName.toLowerCase();
    return `SELECT ${vals} FROM ${tbl} ORDER BY ${desc} LIMIT 1`;
  },

  // Compiles a columnInfo query
  columnInfo() {
    const column = this.single.columnInfo;

    let sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    const bindings = [this.single.table.toLowerCase(), this.client.database().toLowerCase()];

    if (this.single.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.single.schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    return {
      sql,
      bindings,
      output(resp) {
        const out = reduce(resp.rows, function(columns, val) {
          columns[val.column_name] = {
            type: val.data_type,
            maxLength: val.character_maximum_length,
            nullable: (val.is_nullable === 'YES'),
            defaultValue: val.column_default
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  }
})

export default QueryCompiler_Redshift;
