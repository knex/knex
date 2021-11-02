/* eslint max-len:0 */

// View Compiler
// -------
const { pushQuery } = require('./internal/helpers');
const groupBy = require('lodash/groupBy');
const { columnize: columnize_ } = require('../formatter/wrappingFormatter');

class ViewCompiler {
  constructor(client, viewBuilder) {
    this.client = client;
    this.viewBuilder = viewBuilder;
    this._commonBuilder = this.viewBuilder;
    this.method = viewBuilder._method;
    this.schemaNameRaw = viewBuilder._schemaName;
    this.viewNameRaw = viewBuilder._viewName;
    this.single = viewBuilder._single;
    this.selectQuery = viewBuilder._selectQuery;
    this.columns = viewBuilder._columns;
    this.grouped = groupBy(viewBuilder._statements, 'grouping');

    this.formatter = client.formatter(viewBuilder);
    this.bindings = [];
    this.formatter.bindings = this.bindings;
    this.bindingsHolder = this;

    this.sequence = [];
  }

  // Convert the tableCompiler toSQL
  toSQL() {
    this[this.method]();
    return this.sequence;
  }

  // Column Compilation
  // -------

  create() {
    this.createQuery(this.columns, this.selectQuery);
  }

  createOrReplace() {
    throw new Error('replace views is not supported by this dialect.');
  }

  createMaterializedView() {
    throw new Error('materialized views are not supported by this dialect.');
  }

  createQuery(columns, selectQuery, materialized, replace) {
    const createStatement =
      'create ' +
      (materialized ? 'materialized ' : '') +
      'view ' +
      (replace ? 'or replace ' : '');
    const formatColumns = [];
    for (const c of columns) {
      formatColumns.push(
        columnize_(c, this.viewBuilder, this.client, this.bindingsHolder)
      );
    }
    let sql =
      createStatement + this.viewName() + ' (' + formatColumns.join(', ') + ')';
    sql += ' as ';
    sql += selectQuery.toString();
    switch (this.single.checkOption) {
      case 'default_option':
        sql += ' with check option';
        break;
      case 'local':
        sql += ' with local check option';
        break;
      case 'cascaded':
        sql += ' with cascaded check option';
        break;
      default:
        break;
    }
    this.pushQuery({
      sql,
    });
  }

  renameView(from, to) {
    throw new Error(
      'rename view is not supported by this dialect (instead drop, then create another view).'
    );
  }

  refreshMaterializedView() {
    throw new Error('materialized views are not supported by this dialect.');
  }

  alter() {
    this.alterView();
  }

  alterView() {
    const alterView = this.grouped.alterView || [];
    for (let i = 0, l = alterView.length; i < l; i++) {
      const statement = alterView[i];
      if (this[statement.method]) {
        this[statement.method].apply(this, statement.args);
      } else {
        this.client.logger.error(`Debug: ${statement.method} does not exist`);
      }
    }
    for (const item in this.single) {
      if (typeof this[item] === 'function') this[item](this.single[item]);
    }
  }

  renameColumn(from, to) {
    throw new Error('rename column of views is not supported by this dialect.');
  }

  defaultTo(column, defaultValue) {
    throw new Error(
      'change default values of views is not supported by this dialect.'
    );
  }

  viewName() {
    const name = this.schemaNameRaw
      ? `${this.schemaNameRaw}.${this.viewNameRaw}`
      : this.viewNameRaw;

    return this.formatter.wrap(name);
  }
}

ViewCompiler.prototype.pushQuery = pushQuery;

module.exports = ViewCompiler;
