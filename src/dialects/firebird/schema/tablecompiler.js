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
      ? `EXECUTE BLOCK AS BEGIN if (not exists(select 1 from rdb$relations where lower(rdb$relation_name) = lower('${this.tableName()}'))) then 
      execute statement 'create table `
      : 'create table ';

    const sql = `${createStatement}${this.tableName()} (${columns.sql.join(
      ', '
    )});${ifNot ? "'; END;" : ''}`;

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
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(
      `create index ${indexName} on ${this.tableName()} (${this.formatter.columnize(
        columns
      )});`
    );
  },

  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName};`);
  },

  primary(columns) {
    this.pushQuery(
      `alter table ${this.tableName()} add primary key (${this.formatter.columnize(
        columns
      )})`
    );
  },

  unique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(
      `create unique index ${indexName} on ${this.tableName()} (${this.formatter.columnize(
        columns
      )});`
    );
  },

  dropUnique(column, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery(`drop index ${indexName};`);
  },

  foreign(foreignData) {
    if (foreignData.inTable && foreignData.references) {
      const column = this.formatter.columnize(foreignData.column);
      const references = this.formatter.columnize(foreignData.references);
      const inTable = this.formatter.wrap(foreignData.inTable);
      const keyName = foreignData.keyName
        ? this.formatter.wrap(foreignData.keyName)
        : this._indexCommand('fk', this.tableNameRaw, foreignData.column);
      const onUpdate = foreignData.onUpdate
        ? ' on update ' + foreignData.onUpdate
        : '';
      const onDelete = foreignData.onDelete
        ? ' on delete ' + foreignData.onDelete
        : '';

      this.pushQuery(
        (!this.forCreate ? `alter table ${this.tableName()} add ` : '') +
          'constraint ' +
          keyName +
          ' ' +
          'foreign key (' +
          column +
          ') references ' +
          inTable +
          ' (' +
          references +
          ')' +
          onUpdate +
          onDelete
      );
    }
  },

  dropForeign(columns, foreignConstraintName) {
    foreignConstraintName = foreignConstraintName
      ? this.formatter.wrap(foreignConstraintName)
      : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${foreignConstraintName}`
    );
  },

  // Compile a drop primary key command.
  dropPrimary(pkConstraintName) {
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${pkConstraintName}`
    );
  },
});

export default TableCompiler_Firebird;
