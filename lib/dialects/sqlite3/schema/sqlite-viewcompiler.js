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
    const selectQuery = this.selectQuery.toString();
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
    const createSql = `create view ${viewName}${columnList} as ${selectQuery}`;

    this.pushQuery({
      sql: dropSql,
    });
    this.pushQuery({
      sql: createSql,
    });
  }
}

module.exports = ViewCompiler_SQLite3;
