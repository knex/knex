/* eslint max-len:0 no-console:0*/

// Firebird Table Builder & Compiler
// -------
import inherits from 'inherits';
import TableCompiler from '../../../schema/tablecompiler';

import { assign } from 'lodash';

// Table Compiler
// ------

function TableCompiler_Firebird() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Firebird, TableCompiler);

assign(TableCompiler_Firebird.prototype, {
  createQuery(columns, ifNot) {
    const createStatement = ifNot
      ? `if (not exists(select 1 from rdb$relations where rdb$relation_name = '${this.tableName()}')) then 
      execute statement ' create table `
      : 'create table ';

    const sql = `${createStatement}${this.tableName()} (${columns.sql.join(
      ', '
    )});`;

    this.pushQuery({
      sql: sql,
      bindings: columns.bindings,
    });

    if (this.single.comment) this.comment(this.single.comment);
  },

  addColumnsPrefix: 'add ',

  dropColumnPrefix: 'drop ',

  alterColumnPrefix: 'alter column ',

  // Compiles the comment on the table.
  comment(_comment) {
    this.pushQuery(`comment on table ${this.tableName()} is '${_comment}';`);
  },

  changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  // Renames a column on the table.
  renameColumn(from, to) {
    const table = this.tableName();
    const wrapped = `${this.formatter.wrap(from)} to ${this.formatter.wrap(
      to
    )}`;

    this.pushQuery({
      sql: `alter table ${table} alter column ${wrapped}`,
    });
  },

  index(columns, indexName) {
    this.client.logger.warn('table index pending implementation');
  },

  primary(columns) {
    this.pushQuery(
      `alter table ${this.tableName()} add primary key (${this.formatter.columnize(
        columns
      )})`
    );
  },

  unique(columns, indexName) {
    this.client.logger.warn('table unique pending implementation');
  },

  // Compile a drop index command.
  dropIndex: function dropIndex(columns, indexName) {
    this.client.logger.warn('table drop index pending implementation');
  },

  // Compile a drop foreign key command.
  dropForeign: function dropForeign(columns, indexName) {
    this.client.logger.warn('table drop foreign pending implementation');
  },

  // Compile a drop primary key command.
  dropPrimary: function dropPrimary(pkConstraintName) {
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${pkConstraintName}`
    );
  },

  // Compile a drop unique key command.
  dropUnique: function dropUnique(column, indexName) {
    this.client.logger.warn('table drop unique pending implementation');
  },
});

export default TableCompiler_Firebird;
