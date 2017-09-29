
// Redshift Query Builder & Compiler
// ------
import inherits from 'inherits';

import QueryCompiler from '../../../query/compiler';
import QueryCompiler_PG from '../../postgres/query/compiler';
import * as helpers from '../../../helpers';

import { assign, reduce } from 'lodash';

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
      sql,
      returning,
    };
    const length = this.single && this.single.insert && Array.isArray(this.single.insert) ? this.single.insert.length : 1;
    if (returning) {
      res.returningSql = this._returning(length).bind(this);
    }
    return res;
  },

  // Compiles an `update` query, allowing for a return value.
  update() {
    const sql = QueryCompiler.prototype.update.call(this)
    const { returning } = this.single;
    const res = {
      sql,
      returning,
    }
    if (returning) {
      res.returningSql = this._returning().bind(this);
    }
    return res;
  },

  // Compiles an `delete` query, allowing for a return value.
  del() {
    const sql = QueryCompiler.prototype.del.apply(this, arguments);
    const { returning } = this.single;
    const res = {
      sql,
      returning,
    }
    if (returning) {
      // NB: this won't work in redshift. I'm not sure of a workaround, 
      // other than trying to select *before* deleting.
      res.returningSql = this._returning().bind(this);
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

  _returning(length) {
    return function(returning){
      if (!returning) { return ''; }
      const vals = /\*/.test(returning) ? '*' : this.formatter.columnize(returning);
      let order = "ORDER BY " + (/\*/.test(returning) ? '"id" DESC ' : Array.isArray(returning) ? this.formatter.columnize(returning).split(", ").map(v => v + " DESC").join() : returning + " DESC");
      const tbl = this.tableName.toLowerCase();
      let limit = length ? `LIMIT ${length}` : ``;
      const wheres = length ? undefined : this.where();
      let bindings;
      if (wheres){
        bindings = this.grouped.where.map(w => w.value);
        limit = ``;
        order = ``;
      }
      return {
        sql: `SELECT ${vals} FROM ${tbl} ${wheres} ${order} ${limit}`.trim(),
        bindings,
      }
    }
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
