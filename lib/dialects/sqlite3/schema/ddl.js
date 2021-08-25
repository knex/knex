// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------

const identity = require('lodash/identity');
const { nanonum } = require('../../../util/nanoid');
const {
  createNewTable,
  copyData,
  dropOriginal,
  renameTable,
  getTableSql,
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

    this.trx.disableProcessing();
    return this.trx.raw(getTableSql(tableName)).then((result) => {
      this.trx.enableProcessing();
      return {
        createTable: result.filter((create) => create.type === 'table')[0].sql,
        createIndices: result
          .filter((create) => create.type === 'index')
          .map((create) => create.sql),
      };
    });
  }

  renameTable() {
    return this.trx.raw(renameTable(this.alteredName, this.tableName()));
  }

  dropOriginal() {
    return this.trx.raw(dropOriginal(this.tableName()));
  }

  copyData(columns) {
    return this.trx.raw(copyData(this.tableName(), this.alteredName, columns));
  }

  createNewTable(sql) {
    return this.trx.raw(
      createNewTable(sql, this.tableName(), this.alteredName)
    );
  }

  alterColumn(columns) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const { createTable, createIndices } = await this.getTableSql();

        const parsedTable = parseCreateTable(createTable);

        parsedTable.columns = parsedTable.columns.map((column) => {
          const newColumnInfo = columns.find((c) =>
            isEqualId(c.name, column.name)
          );

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

        return this.alter(newTable, createIndices);
      },
      { connection: this.connection }
    );
  }

  dropColumn(columns) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const { createTable, createIndices } = await this.getTableSql();

        const parsedTable = parseCreateTable(createTable);

        parsedTable.columns = parsedTable.columns.filter(
          (parsedColumn) =>
            parsedColumn.expression || !includesId(columns, parsedColumn.name)
        );

        if (parsedTable.columns.length === 0) {
          throw new Error('Unable to drop last column from table');
        }

        parsedTable.constraints = parsedTable.constraints.filter(
          (constraint) => {
            if (
              constraint.type === 'PRIMARY KEY' ||
              constraint.type === 'UNIQUE'
            ) {
              return constraint.columns.every(
                (constraintColumn) =>
                  constraintColumn.expression ||
                  !includesId(columns, constraintColumn.name)
              );
            } else if (constraint.type === 'FOREIGN KEY') {
              return (
                constraint.columns.every(
                  (constraintColumnName) =>
                    !includesId(columns, constraintColumnName)
                ) &&
                (constraint.references.table !== parsedTable.table ||
                  constraint.references.columns.every(
                    (referenceColumnName) =>
                      !includesId(columns, referenceColumnName)
                  ))
              );
            } else {
              return true;
            }
          }
        );

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
      },
      { connection: this.connection }
    );
  }

  dropForeign(columns, foreignKeyName) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const { createTable, createIndices } = await this.getTableSql();

        const parsedTable = parseCreateTable(createTable);

        if (!foreignKeyName) {
          parsedTable.columns = parsedTable.columns.map((column) => ({
            ...column,
            references: includesId(columns, column.name)
              ? null
              : column.references,
          }));
        }

        parsedTable.constraints = parsedTable.constraints.filter(
          (constraint) => {
            if (constraint.type === 'FOREIGN KEY') {
              if (foreignKeyName) {
                return (
                  !constraint.name ||
                  !isEqualId(constraint.name, foreignKeyName)
                );
              }

              return constraint.columns.every(
                (constraintColumnName) =>
                  !includesId(columns, constraintColumnName)
              );
            } else {
              return true;
            }
          }
        );

        const newTable = compileCreateTable(parsedTable, this.wrap);

        return this.alter(newTable, createIndices);
      },
      { connection: this.connection }
    );
  }

  dropPrimary(constraintName) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const { createTable, createIndices } = await this.getTableSql();

        const parsedTable = parseCreateTable(createTable);

        parsedTable.columns = parsedTable.columns.map((column) => ({
          ...column,
          primary: null,
        }));

        parsedTable.constraints = parsedTable.constraints.filter(
          (constraint) => {
            if (constraint.type === 'PRIMARY KEY') {
              if (constraintName) {
                return (
                  !constraint.name ||
                  !isEqualId(constraint.name, constraintName)
                );
              } else {
                return false;
              }
            } else {
              return true;
            }
          }
        );

        const newTable = compileCreateTable(parsedTable, this.wrap);

        return this.alter(newTable, createIndices);
      },
      { connection: this.connection }
    );
  }

  primary(columns, constraintName) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const { createTable, createIndices } = await this.getTableSql();

        const parsedTable = parseCreateTable(createTable);

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
      },
      { connection: this.connection }
    );
  }

  foreign(foreignInfo) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const { createTable, createIndices } = await this.getTableSql();

        const parsedTable = parseCreateTable(createTable);

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
      },
      { connection: this.connection }
    );
  }

  async alter(newSql, createIndices, columns) {
    await this.createNewTable(newSql);
    await this.copyData(columns);
    await this.dropOriginal();
    await this.renameTable();

    for (const createIndex of createIndices) {
      await this.trx.raw(createIndex);
    }
  }

  generateAlterCommands(newSql, createIndices, columns) {
    const result = [];

    result.push(createNewTable(newSql, this.tableName(), this.alteredName));
    result.push(copyData(this.tableName(), this.alteredName, columns));
    result.push(dropOriginal(this.tableName()));
    result.push(renameTable(this.alteredName, this.tableName()));

    for (const createIndex of createIndices) {
      result.push(createIndex);
    }

    return result;
  }
}

module.exports = SQLite3_DDL;
