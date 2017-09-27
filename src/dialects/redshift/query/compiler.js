
// Redshift Query Builder & Compiler
// ------
import inherits from 'inherits';

import QueryCompiler_PG from '../../postgres/query/compiler';
import * as helpers from '../../../helpers';

import { assign, reduce } from 'lodash';

function QueryCompiler_Redshift(client, builder) {
  QueryCompiler_PG.call(this, client, builder);
}
inherits(QueryCompiler_Redshift, QueryCompiler_PG);

assign(QueryCompiler_Redshift.prototype, {
  truncate() {
    return `truncate ${this.tableName}`;
  },

  _returning(value) {
    return '';
  },

  forUpdate() {
    if (this.client.transacting && this.single.table){
      const { returning } = this.single;
      return {
        sql: `; LOCK TABLE ${this.single.table.toLowerCase()};`,
        returning,
      }
    }
    helpers.warn('table lock is not supported by redshift dialect outside a transaction');
    return '';
  },

  forShare() {
    helpers.warn('lock for share is not supported by redshift dialect');
    return '';
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
