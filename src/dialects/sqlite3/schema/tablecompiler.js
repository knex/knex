import TableCompiler from '../../../schema/tablecompiler';

import { filter, values } from 'lodash';

// Table Compiler
// -------

class TableCompiler_SQLite3 extends TableCompiler {
  primaryKey = undefined;

  // Create a new table.
  createQuery(columns, ifNot) {
    const createStatement = ifNot
      ? 'create table if not exists '
      : 'create table ';
    let sql =
      createStatement + this.tableName() + ' (' + columns.sql.join(', ');

    // SQLite forces primary keys to be added when the table is initially created
    // so we will need to check for a primary key commands and add the columns
    // to the table's declaration here so they can be created on the tables.
    sql += this.foreignKeys() || '';
    sql += this.primaryKeys() || '';
    sql += ')';

    this.pushQuery(sql);
  }

  addColumns(columns, prefix) {
    if (prefix) {
      throw new Error('Sqlite does not support alter column.');
    }
    for (let i = 0, l = columns.sql.length; i < l; i++) {
      this.pushQuery({
        sql: `alter table ${this.tableName()} add column ${columns.sql[i]}`,
        bindings: columns.bindings[i],
      });
    }
  }

  // Compile a drop unique key command.
  dropUnique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  }

  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  }

  // Compile a unique key command.
  unique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);
    this.pushQuery(
      `create unique index ${indexName} on ${this.tableName()} (${columns})`
    );
  }

  // Compile a plain index key command.
  index(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);
    this.pushQuery(
      `create index ${indexName} on ${this.tableName()} (${columns})`
    );
  }

  primary() {
    if (this.method !== 'create' && this.method !== 'createIfNot') {
      this.client.logger.warn(
        'SQLite3 Foreign & Primary keys may only be added on create'
      );
    }
  }

  primaryKeys() {
    const pks = filter(this.grouped.alterTable || [], { method: 'primary' });
    if (pks.length > 0 && pks[0].args.length > 0) {
      const args = Array.isArray(pks[0].args[0]) ? pks[0].args[0] : pks[0].args;
      return `, primary key (${this.formatter.columnize(args)})`;
    }
  }

  foreignKeys() {
    let sql = '';
    const foreignKeys = filter(this.grouped.alterTable || [], {
      method: 'foreign',
    });
    for (let i = 0, l = foreignKeys.length; i < l; i++) {
      const foreign = foreignKeys[i].args[0];
      const column = this.formatter.columnize(foreign.column);
      const references = this.formatter.columnize(foreign.references);
      const foreignTable = this.formatter.wrap(foreign.inTable);
      sql += `, foreign key(${column}) references ${foreignTable}(${references})`;
      if (foreign.onDelete) sql += ` on delete ${foreign.onDelete}`;
      if (foreign.onUpdate) sql += ` on update ${foreign.onUpdate}`;
    }
    return sql;
  }

  createTableBlock() {
    return this.getColumns()
      .concat()
      .join(',');
  }

  // Compile a rename column command... very complex in sqlite
  renameColumn(from, to) {
    const compiler = this;
    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .renameColumn(from, to);
      },
    });
  }

  dropColumn() {
    const compiler = this;
    const columns = values(arguments);
    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .dropColumn(columns);
      },
    });
  }
}

TableCompiler_SQLite3.prototype.foreign =
  TableCompiler_SQLite3.prototype.primary;

export default TableCompiler_SQLite3;
