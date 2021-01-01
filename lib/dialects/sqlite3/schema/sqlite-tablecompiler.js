const { inherits } = require('util');
const TableCompiler = require('../../../schema/tablecompiler');

const filter = require('lodash/filter');
const values = require('lodash/values');

// Table Compiler
// -------

function TableCompiler_SQLite3() {
  TableCompiler.apply(this, arguments);
  this.primaryKey = void 0;
}
inherits(TableCompiler_SQLite3, TableCompiler);

// Create a new table.
TableCompiler_SQLite3.prototype.createQuery = function (columns, ifNot) {
  const createStatement = ifNot
    ? 'create table if not exists '
    : 'create table ';
  let sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ');

  // SQLite forces primary keys to be added when the table is initially created
  // so we will need to check for a primary key commands and add the columns
  // to the table's declaration here so they can be created on the tables.
  sql += this.foreignKeys() || '';
  sql += this.primaryKeys() || '';
  sql += ')';

  this.pushQuery(sql);
};

TableCompiler_SQLite3.prototype.addColumns = function (columns, prefix) {
  if (prefix) {
    throw new Error('Sqlite does not support alter column.');
  }
  for (let i = 0, l = columns.sql.length; i < l; i++) {
    this.pushQuery({
      sql: `alter table ${this.tableName()} add column ${columns.sql[i]}`,
      bindings: columns.bindings[i],
    });
  }
};

// Compile a drop unique key command.
TableCompiler_SQLite3.prototype.dropUnique = function (columns, indexName) {
  indexName = indexName
    ? this.formatter.wrap(indexName)
    : this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery(`drop index ${indexName}`);
};

// Compile a drop foreign key command.
TableCompiler_SQLite3.prototype.dropForeign = function (columns, indexName) {
  const compiler = this;

  this.pushQuery({
    sql: `PRAGMA table_info(${this.tableName()})`,
    output(pragma) {
      return compiler.client
        .ddl(compiler, pragma, this.connection)
        .dropForeign(columns, indexName);
    },
  });
};

// Compile a drop primary key command.
TableCompiler_SQLite3.prototype.dropPrimary = function (constraintName) {
  const compiler = this;

  this.pushQuery({
    sql: `PRAGMA table_info(${this.tableName()})`,
    output(pragma) {
      return compiler.client
        .ddl(compiler, pragma, this.connection)
        .dropPrimary(constraintName);
    },
  });
};

TableCompiler_SQLite3.prototype.dropIndex = function (columns, indexName) {
  indexName = indexName
    ? this.formatter.wrap(indexName)
    : this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery(`drop index ${indexName}`);
};

// Compile a unique key command.
TableCompiler_SQLite3.prototype.unique = function (columns, indexName) {
  indexName = indexName
    ? this.formatter.wrap(indexName)
    : this._indexCommand('unique', this.tableNameRaw, columns);
  columns = this.formatter.columnize(columns);
  this.pushQuery(
    `create unique index ${indexName} on ${this.tableName()} (${columns})`
  );
};

// Compile a plain index key command.
TableCompiler_SQLite3.prototype.index = function (columns, indexName) {
  indexName = indexName
    ? this.formatter.wrap(indexName)
    : this._indexCommand('index', this.tableNameRaw, columns);
  columns = this.formatter.columnize(columns);
  this.pushQuery(
    `create index ${indexName} on ${this.tableName()} (${columns})`
  );
};

/**
 * Add a primary key to an existing table.
 *
 * @NOTE The `createQuery` method above handles table creation. Don't do anything regarding table
 *       creation in this method
 *
 * @param {string | string[]} columns - Column name(s) to assign as primary keys
 * @param {string} [constraintName] - Custom name for the PK constraint
 */
TableCompiler_SQLite3.prototype.primary = function (columns, constraintName) {
  const compiler = this;

  columns = this.formatter.columnize(columns);
  columns = Array.isArray(columns) ? columns : [columns];

  if (this.method !== 'create' && this.method !== 'createIfNot') {
    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .primary(columns, constraintName);
      },
    });
  }
};

/**
 * Add a foreign key constraint to an existing table
 *
 * @NOTE The `createQuery` method above handles foreign key constraints on table creation. Don't do
 *       anything regarding table creation in this method
 *
 * @param {object} foreignInfo - Information about the current column foreign setup
 * @param {string | string[]} [foreignInfo.column] - Column in the current constraint
 * @param {string | undefined} foreignInfo.keyName - Name of the foreign key constraint
 * @param {string} foreignInfo.references - What column it references in the other table
 * @param {string} foreignInfo.inTable - What table is referenced in this constraint
 * @param {string} [foreignInfo.onUpdate] - What to do on updates
 * @param {string} [foreignInfo.onDelete] - What to do on deletions
 */
TableCompiler_SQLite3.prototype.foreign = function (foreignInfo) {
  const compiler = this;

  if (this.method !== 'create' && this.method !== 'createIfNot') {
    foreignInfo.column = this.formatter.columnize(foreignInfo.column);
    foreignInfo.column = Array.isArray(foreignInfo.column)
      ? foreignInfo.column
      : [foreignInfo.column];
    foreignInfo.inTable = this.formatter.columnize(foreignInfo.inTable);
    foreignInfo.references = this.formatter.columnize(foreignInfo.references);

    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .foreign(foreignInfo);
      },
    });
  }
};

TableCompiler_SQLite3.prototype.primaryKeys = function () {
  const pks = filter(this.grouped.alterTable || [], { method: 'primary' });
  if (pks.length > 0 && pks[0].args.length > 0) {
    const columns = pks[0].args[0];
    let constraintName = pks[0].args[1] || '';
    if (constraintName) {
      constraintName = ' constraint ' + this.formatter.wrap(constraintName);
    }
    return `,${constraintName} primary key (${this.formatter.columnize(
      columns
    )})`;
  }
};

TableCompiler_SQLite3.prototype.foreignKeys = function () {
  let sql = '';
  const foreignKeys = filter(this.grouped.alterTable || [], {
    method: 'foreign',
  });
  for (let i = 0, l = foreignKeys.length; i < l; i++) {
    const foreign = foreignKeys[i].args[0];
    const column = this.formatter.columnize(foreign.column);
    const references = this.formatter.columnize(foreign.references);
    const foreignTable = this.formatter.wrap(foreign.inTable);
    let constraintName = foreign.keyName || '';
    if (constraintName) {
      constraintName = ' constraint ' + this.formatter.wrap(constraintName);
    }
    sql += `,${constraintName} foreign key(${column}) references ${foreignTable}(${references})`;
    if (foreign.onDelete) sql += ` on delete ${foreign.onDelete}`;
    if (foreign.onUpdate) sql += ` on update ${foreign.onUpdate}`;
  }
  return sql;
};

TableCompiler_SQLite3.prototype.createTableBlock = function () {
  return this.getColumns().concat().join(',');
};

// Compile a rename column command... very complex in sqlite
TableCompiler_SQLite3.prototype.renameColumn = function (from, to) {
  const compiler = this;
  this.pushQuery({
    sql: `PRAGMA table_info(${this.tableName()})`,
    output(pragma) {
      return compiler.client
        .ddl(compiler, pragma, this.connection)
        .renameColumn(from, to);
    },
  });
};

TableCompiler_SQLite3.prototype.dropColumn = function () {
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
};

module.exports = TableCompiler_SQLite3;
