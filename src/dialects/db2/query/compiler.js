
// DB2 Query Builder & Compiler
// ------
import inherits from 'inherits';

import QueryCompiler from '../../../query/compiler';

import { assign, reduce } from 'lodash'

function QueryCompiler_DB2(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_DB2, QueryCompiler);

assign(QueryCompiler_DB2.prototype, {

  // Compiles a truncate query.
  truncate() {
    return `truncate table ${this.tableName} immediate`;
  },

  // is used if the an array with multiple empty values supplied
  _defaultInsertValue: 'default',

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const sql = QueryCompiler.prototype.insert.call(this)
    if (sql === '') return sql;
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  update() {
    const updateData = this._prepUpdate(this.single.update);
    const wheres = this.where();
    const { returning } = this.single;
    return {
      sql: this.with() + `update ${this.tableName} set ${updateData.join(', ')}` +
      (wheres ? ` ${wheres}` : '') + this._returning(returning),
      returning
    };
  },

  // Compiles an `delete` query, allowing for a return value.
  del() {
    const sql = QueryCompiler.prototype.del.apply(this, arguments);
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning
    };
  },

  _returning(value) {
    // return value ? ` returning ${this.formatter.columnize(value)}` : '';
    return '';
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

    let sql = 'select * from syscat.columns where tabname = ? and table_catalog = ?';
    const bindings = [this.single.table, this.client.database()];

    if (this.single.schema) {
      sql += ' and tabschema = ?';
      bindings.push(this.single.schema);
    } else {
      sql += ' and tabschema = current_schema';
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

export default QueryCompiler_DB2;
