
// MySQL Query Compiler
// ------
import inherits from 'inherits';
import QueryCompiler from '../../../query/compiler';

import { assign } from 'lodash'

function QueryCompiler_MySQL(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_MySQL, QueryCompiler)

assign(QueryCompiler_MySQL.prototype, {

  _emptyInsertValue: '() values ()',

  // Update method, including joins, wheres, order & limits.
  update() {
    const join = this.join();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    return `update ${this.tableName}` +
      (join ? ` ${join}` : '') +
      ' set ' + updates.join(', ') +
      (where ? ` ${where}` : '') +
      (order ? ` ${order}` : '') +
      (limit ? ` ${limit}` : '');
  },

  forUpdate() {
    return 'for update';
  },

  forShare() {
    return 'lock in share mode';
  },

  // Compiles a `columnInfo` query.
  columnInfo() {
    const column = this.single.columnInfo;
    return {
      sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
      bindings: [this.single.table, this.client.database()],
      output(resp) {
        const out = resp.reduce(function(columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE,
            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
            nullable: (val.IS_NULLABLE === 'YES')
          };
          return columns
        }, {})
        return column && out[column] || out;
      }
    };
  },

  limit() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only.
    // see: http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
    const limit = (this.single.offset && noLimit)
      ? '18446744073709551615'
      : this.formatter.parameter(this.single.limit)
    return `limit ${limit}`;
  }

})

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
export default QueryCompiler_MySQL;
