// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------

const identity = require('lodash/identity');
const { nanonum } = require('../../../util/nanoid');
const {
  copyData,
  dropOriginal,
  renameTable,
  getTableSql,
  isForeignCheckEnabled,
  setForeignCheck,
  executeForeignCheck,
} = require('./internal/sqlite-ddl-operations');
const { parseCreateTable, parseCreateIndex } = require('./internal/parser');
const {
  compileCreateTable,
  compileCreateIndex,
} = require('./internal/compiler');
const { isEqualId, includesId } = require('./internal/utils');

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.
class SQLite3_DDL {
  constructor(client, tableCompiler, pragma, connection) {
    this.client = client;
    this.tableCompiler = tableCompiler;
    this.pragma = pragma;
    this.tableNameRaw = this.tableCompiler.tableNameRaw;
    this.alteredName = `_knex_temp_alter${nanonum(3)}`;
    this.connection = connection;
    this.formatter = (value) =>
      this.client.customWrapIdentifier(value, identity);
    this.wrap = (value) => this.client.wrapIdentifierImpl(value);
  }

  tableName() {
    return this.formatter(this.tableNameRaw);
  }

  getTableSql() {
    const tableName = this.tableName();

    return this.client.transaction(
      async (trx) => {
        trx.disableProcessing();
        const result = await trx.raw(getTableSql(tableName));
        trx.enableProcessing();

        return {
          createTable: result.filter((create) => create.type === 'table')[0]
            .sql,
          createIndices: result
            .filter((create) => create.type === 'index')
            .map((create) => create.sql),
        };
      },
      { connection: this.connection }
    );
  }

  async isForeignCheckEnabled() {
    const result = await this.client
      .raw(isForeignCheckEnabled())
      .connection(this.connection);

    return result[0].foreign_keys === 1;
  }

  async setForeignCheck(enable) {
    await this.client.raw(setForeignCheck(enable)).connection(this.connection);
  }

  renameTable(trx) {
    return trx.raw(renameTable(this.alteredName, this.tableName()));
  }

  dropOriginal(trx) {
    return trx.raw(dropOriginal(this.tableName()));
  }

  copyData(trx, columns) {
    return trx.raw(copyData(this.tableName(), this.alteredName, columns));
  }

  async alterColumn(columns) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    parsedTable.columns = parsedTable.columns.map((column) => {
      const newColumnInfo = columns.find((c) => isEqualId(c.name, column.name));

      if (newColumnInfo) {
        column.type = newColumnInfo.type;

        column.constraints.default =
          newColumnInfo.defaultTo !== null
            ? {
                name: null,
                value: newColumnInfo.defaultTo,
                expression: false,
              }
            : null;

        column.constraints.notnull = newColumnInfo.notNull
          ? { name: null, conflict: null }
          : null;

        column.constraints.null = newColumnInfo.notNull
          ? null
          : column.constraints.null;
      }

      return column;
    });

    const newTable = compileCreateTable(parsedTable, this.wrap);

    return this.generateAlterCommands(newTable, createIndices);
  }

  async dropColumn(columns) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    parsedTable.columns = parsedTable.columns.filter(
      (parsedColumn) =>
        parsedColumn.expression || !includesId(columns, parsedColumn.name)
    );

    if (parsedTable.columns.length === 0) {
      throw new Error('Unable to drop last column from table');
    }

    parsedTable.constraints = parsedTable.constraints.filter((constraint) => {
      if (constraint.type === 'PRIMARY KEY' || constraint.type === 'UNIQUE') {
        return constraint.columns.every(
          (constraintColumn) =>
            constraintColumn.expression ||
            !includesId(columns, constraintColumn.name)
        );
      } else if (constraint.type === 'FOREIGN KEY') {
        return (
          constraint.columns.every(
            (constraintColumnName) => !includesId(columns, constraintColumnName)
          ) &&
          (constraint.references.table !== parsedTable.table ||
            constraint.references.columns.every(
              (referenceColumnName) => !includesId(columns, referenceColumnName)
            ))
        );
      } else {
        return true;
      }
    });

    const newColumns = parsedTable.columns.map((column) => column.name);

    const newTable = compileCreateTable(parsedTable, this.wrap);

    const newIndices = [];
    for (const createIndex of createIndices) {
      const parsedIndex = parseCreateIndex(createIndex);

      parsedIndex.columns = parsedIndex.columns.filter(
        (parsedColumn) =>
          parsedColumn.expression || !includesId(columns, parsedColumn.name)
      );

      if (parsedIndex.columns.length > 0) {
        newIndices.push(compileCreateIndex(parsedIndex, this.wrap));
      }
    }

    return this.alter(newTable, newIndices, newColumns);
  }

  async dropForeign(columns, foreignKeyName) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    if (!foreignKeyName) {
      parsedTable.columns = parsedTable.columns.map((column) => ({
        ...column,
        references: includesId(columns, column.name) ? null : column.references,
      }));
    }

    parsedTable.constraints = parsedTable.constraints.filter((constraint) => {
      if (constraint.type === 'FOREIGN KEY') {
        if (foreignKeyName) {
          return (
            !constraint.name || !isEqualId(constraint.name, foreignKeyName)
          );
        }

        return constraint.columns.every(
          (constraintColumnName) => !includesId(columns, constraintColumnName)
        );
      } else {
        return true;
      }
    });

    const newTable = compileCreateTable(parsedTable, this.wrap);

    return this.alter(newTable, createIndices);
  }

  async dropPrimary(constraintName) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    parsedTable.columns = parsedTable.columns.map((column) => ({
      ...column,
      primary: null,
    }));

    parsedTable.constraints = parsedTable.constraints.filter((constraint) => {
      if (constraint.type === 'PRIMARY KEY') {
        if (constraintName) {
          return (
            !constraint.name || !isEqualId(constraint.name, constraintName)
          );
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    const newTable = compileCreateTable(parsedTable, this.wrap);

    return this.alter(newTable, createIndices);
  }

  async primary(columns, constraintName) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    parsedTable.columns = parsedTable.columns.map((column) => ({
      ...column,
      primary: null,
    }));

    parsedTable.constraints = parsedTable.constraints.filter(
      (constraint) => constraint.type !== 'PRIMARY KEY'
    );

    parsedTable.constraints.push({
      type: 'PRIMARY KEY',
      name: constraintName || null,
      columns: columns.map((column) => ({
        name: column,
        expression: false,
        collation: null,
        order: null,
      })),
      conflict: null,
    });

    const newTable = compileCreateTable(parsedTable, this.wrap);

    return this.alter(newTable, createIndices);
  }

  async foreign(foreignInfo) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    parsedTable.constraints.push({
      type: 'FOREIGN KEY',
      name: foreignInfo.keyName || null,
      columns: foreignInfo.column,
      references: {
        table: foreignInfo.inTable,
        columns: foreignInfo.references,
        delete: foreignInfo.onDelete || null,
        update: foreignInfo.onUpdate || null,
        match: null,
        deferrable: null,
      },
    });

    const newTable = compileCreateTable(parsedTable, this.wrap);

    return this.generateAlterCommands(newTable, createIndices);
  }

  async setNullable(column, isNullable) {
    const { createTable, createIndices } = await this.getTableSql();

    const parsedTable = parseCreateTable(createTable);
    parsedTable.table = this.alteredName;

    const parsedColumn = parsedTable.columns.find((c) =>
      isEqualId(column, c.name)
    );

    if (!parsedColumn) {
      throw new Error(
        `.setNullable: Column ${column} does not exist in table ${this.tableName()}.`
      );
    }

    parsedColumn.constraints.notnull = isNullable
      ? null
      : { name: null, conflict: null };

    parsedColumn.constraints.null = isNullable
      ? parsedColumn.constraints.null
      : null;

    const newTable = compileCreateTable(parsedTable, this.wrap);

    return this.generateAlterCommands(newTable, createIndices);
  }

  async alter(newSql, createIndices, columns) {
    const wasForeignCheckEnabled = await this.isForeignCheckEnabled();

    if (wasForeignCheckEnabled) {
      await this.setForeignCheck(false);
    }

    try {
      await this.client.transaction(
        async (trx) => {
          await trx.raw(newSql);
          await this.copyData(trx, columns);
          await this.dropOriginal(trx);
          await this.renameTable(trx);

          for (const createIndex of createIndices) {
            await trx.raw(createIndex);
          }

          if (wasForeignCheckEnabled) {
            const foreignViolations = await trx.raw(executeForeignCheck());

            if (foreignViolations.length > 0) {
              throw new Error('FOREIGN KEY constraint failed');
            }
          }
        },
        { connection: this.connection }
      );
    } finally {
      if (wasForeignCheckEnabled) {
        await this.setForeignCheck(true);
      }
    }
  }

  async generateAlterCommands(newSql, createIndices, columns) {
    const sql = [];
    const pre = [];
    const post = [];
    let check = null;

    sql.push(newSql);
    sql.push(copyData(this.tableName(), this.alteredName, columns));
    sql.push(dropOriginal(this.tableName()));
    sql.push(renameTable(this.alteredName, this.tableName()));

    for (const createIndex of createIndices) {
      sql.push(createIndex);
    }

    const isForeignCheckEnabled = await this.isForeignCheckEnabled();

    if (isForeignCheckEnabled) {
      pre.push(setForeignCheck(false));
      post.push(setForeignCheck(true));

      check = executeForeignCheck();
    }

    return { pre, sql, check, post };
  }
}

module.exports = SQLite3_DDL;
