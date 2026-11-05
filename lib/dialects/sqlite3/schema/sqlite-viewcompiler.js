/* eslint max-len: 0 */

const ViewCompiler = require('../../../schema/viewcompiler.js');
const {
  columnize: columnize_,
} = require('../../../formatter/wrappingFormatter');

class ViewCompiler_SQLite3 extends ViewCompiler {
  constructor(client, viewCompiler) {
    super(client, viewCompiler);
  }
  createOrReplace() {
    const columns = this.columns;
    const selectQuery =
      typeof this.selectQuery.toSQL === 'function'
        ? this.selectQuery.toSQL()
        : { sql: this.selectQuery.toString(), bindings: [] };
    const viewName = this.viewName();

    const columnList = columns
      ? ' (' +
        columnize_(
          columns,
          this.viewBuilder,
          this.client,
          this.bindingsHolder
        ) +
        ')'
      : '';

    const dropSql = `drop view if exists ${viewName}`;
    const createSql = `create view ${viewName}${columnList} as ${selectQuery.sql}`;

    this.pushQuery({
      sql: dropSql,
      bindings: [],
    });
    this.pushQuery({
      sql: createSql,
      bindings: selectQuery.bindings,
    });
  }
}

module.exports = ViewCompiler_SQLite3;
