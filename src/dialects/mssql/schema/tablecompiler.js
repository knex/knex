/* eslint max-len:0 */

// MSSQL Table Builder & Compiler
// -------
import inherits from 'inherits';
import TableCompiler from '../../../schema/tablecompiler';
import * as helpers from '../../../helpers';
import Promise from 'bluebird';

import { assign } from 'lodash'

// Table Compiler
// ------

function TableCompiler_MSSQL() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MSSQL, TableCompiler);

assign(TableCompiler_MSSQL.prototype, {

  createAlterTableMethods: ['foreign', 'primary', 'unique'],
  createQuery (columns, ifNot) {
    const createStatement = ifNot ? `if object_id('${this.tableName()}', 'U') is null CREATE TABLE ` : 'CREATE TABLE ';
    const sql = createStatement + this.tableName() + (this._formatting ? ' (\n    ' : ' (') + columns.sql.join(this._formatting ? ',\n    ' : ', ') + ')';

    if (this.single.comment) {
      const comment = (this.single.comment || '');
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    }

    this.pushQuery(sql);
  },

  lowerCase: false,

  addColumnsPrefix: 'ADD ',

  dropColumnPrefix: 'DROP COLUMN ',

  // Compiles column add.  Multiple columns need only one ADD clause (not one ADD per column) so core addColumns doesn't work.  #1348
  addColumns (columns) {
    if (columns.sql.length > 0) {
      this.pushQuery({
        sql: (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + this.addColumnsPrefix + columns.sql.join(', '),
        bindings: columns.bindings
      });
    }
  },

  // Compiles column drop.  Multiple columns need only one DROP clause (not one DROP per column) so core dropColumn doesn't work.  #1348
  dropColumn () {
    const _this2 = this;
    const columns = helpers.normalizeArr.apply(null, arguments);

    const drops = (Array.isArray(columns) ? columns : [columns]).map(column => _this2.formatter.wrap(column));
    this.pushQuery((this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + this.dropColumnPrefix + drops.join(', '));
  },

  // Compiles the comment on the table.
  comment () {
  },

  changeType () {
  },

  // Renames a column on the table.
  renameColumn (from, to) {
    this.pushQuery(`exec sp_rename ${this.formatter.parameter(this.tableName() + '.' + from)}, ${this.formatter.parameter(to)}, 'COLUMN'`);
  },

  dropFKRefs (runner, refs) {
    const formatter = this.client.formatter();
    return Promise.all(refs.map(function (ref) {
      const constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
      const tableName = formatter.wrap(ref.TABLE_NAME);
      return runner.query({
        sql: `ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`
      });
    }));
  },
  createFKRefs (runner, refs) {
    const formatter = this.client.formatter();

    return Promise.all(refs.map(function (ref) {
      const tableName = formatter.wrap(ref.TABLE_NAME);
      const keyName = formatter.wrap(ref.CONSTRAINT_NAME);
      const column = formatter.columnize(ref.COLUMN_NAME);
      const references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      const inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      const onUpdate = ` ON UPDATE ${ref.UPDATE_RULE}`;
      const onDelete = ` ON DELETE ${ref.DELETE_RULE}`;

      return runner.query({
        sql: `ALTER TABLE ${tableName} ADD CONSTRAINT ${keyName}` +
        ' FOREIGN KEY (' + column + ') REFERENCES ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }));
  },

  index (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`CREATE INDEX ${indexName} ON ${this.tableName()} (${this.formatter.columnize(columns)})`);
  },

  primary (columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    if (!this.forCreate) {
      this.pushQuery(`ALTER TABLE ${this.tableName()} ADD CONSTRAINT ${constraintName} PRIMARY KEY (${this.formatter.columnize(columns)})`);
    } else {
      this.pushQuery(`CONSTRAINT ${constraintName} PRIMARY KEY (${this.formatter.columnize(columns)})`);
    }
  },

  unique (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    if (!this.forCreate) {
      this.pushQuery(`CREATE UNIQUE INDEX ${indexName} ON ${this.tableName()} (${this.formatter.columnize(columns)})`);
    } else {
      this.pushQuery(`CONSTRAINT ${indexName} UNIQUE (${this.formatter.columnize(columns)})`);
    }
  },

  // Compile a drop index command.
  dropIndex (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`DROP INDEX ${indexName} ON ${this.tableName()}`);
  },

  // Compile a drop foreign key command.
  dropForeign (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(`ALTER TABLE ${this.tableName()} DROP CONSTRAINT ${indexName}`);
  },

  // Compile a drop primary key command.
  dropPrimary (constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(`ALTER TABLE ${this.tableName()} DROP CONSTRAINT ${constraintName}`);
  },

  // Compile a drop unique key command.
  dropUnique (column, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery(`ALTER TABLE ${this.tableName()} DROP CONSTRAINT ${indexName}`);
  }

})

export default TableCompiler_MSSQL;
