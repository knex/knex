/* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

const has = require('lodash/has');
const TableCompiler_PG = require('../../postgres/schema/pg-tablecompiler');

class TableCompiler_Redshift extends TableCompiler_PG {
  constructor() {
    super(...arguments);
  }

  index(columns, indexName, options) {
    this.client.logger.warn(
      'Redshift does not support the creation of indexes.'
    );
  }

  dropIndex(columns, indexName) {
    this.client.logger.warn(
      'Redshift does not support the deletion of indexes.'
    );
  }

  // TODO: have to disable setting not null on columns that already exist...

  // Adds the "create" query to the query sequence.
  createQuery(columns, ifNot, like) {
    const createStatement = ifNot
      ? 'create table if not exists '
      : 'create table ';
    const columnsSql = ' (' + columns.sql.join(', ') + ')';
    let sql =
      createStatement +
      this.tableName() +
      (like && this.tableNameLike()
        ? ' (like ' + this.tableNameLike() + ')'
        : columnsSql);
    if (this.single.inherits)
      sql += ` like (${this.formatter.wrap(this.single.inherits)})`;
    this.pushQuery({
      sql,
      bindings: columns.bindings,
    });
    const hasComment = has(this.single, 'comment');
    if (hasComment) this.comment(this.single.comment);
  }

  primary(columns, constraintName) {
    const self = this;
    constraintName = constraintName
      ? self.formatter.wrap(constraintName)
      : self.formatter.wrap(`${this.tableNameRaw}_pkey`);
    if (columns.constructor !== Array) {
      columns = [columns];
    }
    const thiscolumns = self.grouped.columns;

    if (thiscolumns) {
      for (let i = 0; i < columns.length; i++) {
        let exists = thiscolumns.find(
          (tcb) =>
            tcb.grouping === 'columns' &&
            tcb.builder &&
            tcb.builder._method === 'add' &&
            tcb.builder._args &&
            tcb.builder._args.indexOf(columns[i]) > -1
        );
        if (exists) {
          exists = exists.builder;
        }
        const nullable = !(
          exists &&
          exists._modifiers &&
          exists._modifiers['nullable'] &&
          exists._modifiers['nullable'][0] === false
        );
        if (nullable) {
          if (exists) {
            return this.client.logger.warn(
              'Redshift does not allow primary keys to contain nullable columns.'
            );
          } else {
            return this.client.logger.warn(
              'Redshift does not allow primary keys to contain nonexistent columns.'
            );
          }
        }
      }
    }
    return self.pushQuery(
      `alter table ${self.tableName()} add constraint ${constraintName} primary key (${self.formatter.columnize(
        columns
      )})`
    );
  }

  // Compiles column add. Redshift can only add one column per ALTER TABLE, so core addColumns doesn't work.  #2545
  addColumns(columns, prefix, colCompilers) {
    if (prefix === this.alterColumnsPrefix) {
      super.addColumns(columns, prefix, colCompilers);
    } else {
      prefix = prefix || this.addColumnsPrefix;
      colCompilers = colCompilers || this.getColumns();
      for (const col of colCompilers) {
        const quotedTableName = this.tableName();
        const colCompiled = col.compileColumn();

        this.pushQuery({
          sql: `alter table ${quotedTableName} ${prefix}${colCompiled}`,
          bindings: [],
        });
      }
    }
  }
}

module.exports = TableCompiler_Redshift;
