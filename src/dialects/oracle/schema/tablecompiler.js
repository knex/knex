/* eslint max-len:0 */

import inherits from 'inherits';
import * as utils from '../utils';
import TableCompiler from '../../../schema/tablecompiler';
import * as helpers from '../../../helpers';

import { assign } from 'lodash'

// Table Compiler
// ------

function TableCompiler_Oracle() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Oracle, TableCompiler);

assign(TableCompiler_Oracle.prototype, {

  // Compile a rename column command.
  renameColumn(from, to) {
    return this.pushQuery({
      sql: `alter table ${this.tableName()} rename column ` +
        this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
    });
  },

  compileAdd(builder) {
    const table = this.formatter.wrap(builder);
    const columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: `alter table ${table} ${columns.join(', ')}`
    });
  },

  // Adds the "create" query to the query sequence.
  createQuery(columns, ifNot) {
    const sql = `create table ${this.tableName()} (${columns.sql.join(', ')})`;
    this.pushQuery({
      // catch "name is already used by an existing object" for workaround for "if not exists"
      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
      bindings: columns.bindings
    });
    if (this.single.comment) this.comment(this.single.comment);
  },

  // Compiles the comment on the table.
  comment(comment) {
    this.pushQuery(`comment on table ${this.tableName()} is '${comment || ''}'`);
  },

  addColumnsPrefix: 'add ',

  dropColumn() {
    const columns = helpers.normalizeArr.apply(null, arguments);
    this.pushQuery(`alter table ${this.tableName()} drop (${this.formatter.columnize(columns)})`);
  },

  changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  _indexCommand(type, tableName, columns) {
    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
  },

  primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(columns)})`);
  },

  dropPrimary(constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery(`alter table ${this.tableName()} drop constraint ${constraintName}`);
  },

  index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`create index ${indexName} on ${this.tableName()}` +
      ' (' + this.formatter.columnize(columns) + ')');
  },

  dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  },

  unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${indexName}` +
      ' unique (' + this.formatter.columnize(columns) + ')');
  },

  dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} drop constraint ${indexName}`);
  },

  dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} drop constraint ${indexName}`);
  }

})

export default TableCompiler_Oracle;
