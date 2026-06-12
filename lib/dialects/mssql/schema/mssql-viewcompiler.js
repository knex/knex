/* eslint max-len: 0 */

const ViewCompiler = require('../../../schema/viewcompiler.js');
const {
  columnize: columnize_,
} = require('../../../formatter/wrappingFormatter');

class ViewCompiler_MSSQL extends ViewCompiler {
  constructor(client, viewCompiler) {
    super(client, viewCompiler);
  }

  createQuery(columns, selectQuery, materialized, replace) {
    const createStatement = 'CREATE ' + (replace ? 'OR ALTER ' : '') + 'VIEW ';
    let sql = createStatement + this.viewName();

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

    sql += columnList;
    sql += ' AS ';
    sql += selectQuery.toString();
    this.pushQuery({
      sql,
    });
  }

  renameColumn(from, to) {
    this.pushQuery(
      `exec sp_rename ${this.client.parameter(
        this.viewName() + '.' + from,
        this.viewBuilder,
        this.bindingsHolder
      )}, ${this.client.parameter(
        to,
        this.viewBuilder,
        this.bindingsHolder
      )}, 'COLUMN'`
    );
  }

  createOrReplace() {
    this.createQuery(this.columns, this.selectQuery, false, true);
  }
}

module.exports = ViewCompiler_MSSQL;
