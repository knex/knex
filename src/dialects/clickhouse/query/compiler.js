// Clickhouse Query Compiler
// ------
const inherits = require('inherits');
const QueryCompiler = require('../../../query/compiler');
const helpers = require('../../../helpers');

const { assign, identity } = require('lodash');

function QueryCompiler_Clickhouse(client, builder) {
  QueryCompiler.call(this, client, builder);

  const { returning } = this.single;

  if (returning) {
    this.client.logger.warn(
      '.returning() is not supported by Clickhouse and will not have any effect.'
    );
  }
}

inherits(QueryCompiler_Clickhouse, QueryCompiler);

assign(QueryCompiler_Clickhouse.prototype, {
  _emptyInsertValue: '() values ()',

  // Update method, including joins, wheres, order & limits.
  update() {
    const join = this.join();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const preWhere = this.preWhere()
    const order = this.order();
    const limit = this.limit();
    return (
      `update ${this.tableName}` +
      (join ? ` ${join}` : '') +
      ' set ' +
      updates.join(', ') +
      (where ? ` ${where}` : '') +
      (preWhere ? ` ${preWhere}` : '') +
      (order ? ` ${order}` : '') +
      (limit ? ` ${limit}` : '')
    );
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

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql:
        'select * from information_schema.columns where table_name = ? and table_schema = ?',
      bindings: [table, this.client.database()],
      output(resp) {
        const out = resp.reduce(function(columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE,
            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
            nullable: val.IS_NULLABLE === 'YES',
          };
          return columns;
        }, {});
        return (column && out[column]) || out;
      },
    };
  },

  limit() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only.
    // see: http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
    const limit =
      this.single.offset && noLimit
        ? '18446744073709551615'
        : this.formatter.parameter(this.single.limit);
    return `limit ${limit}`;
  },

  //preWhere clause

  // Compiles all `where` statements on the query.
  preWhere() {
    const wheres = this.grouped.where;
    if (!wheres) return;
    const sql = [];
    let i = -1;
    while (++i < wheres.length) {
      const stmt = wheres[i];
      if (
        stmt.hasOwnProperty('value') &&
        helpers.containsUndefined(stmt.value)
      ) {
        this._undefinedInWhereClause = true;
      }
      const val = this[stmt.type](stmt);
      if (val) {
        if (sql.length === 0) {
          sql[0] = 'prewhere';
        } else {
          sql.push(stmt.bool);
        }
        sql.push(val);
      }
    }
    return sql.length > 1 ? sql.join(' ') : '';
  },
});

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_Clickhouse;
