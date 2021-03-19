/* eslint max-len:0 */

// MSSQL Table Builder & Compiler
// -------
const TableCompiler = require('../../../schema/tablecompiler');
const helpers = require('../../../util/helpers');

// Table Compiler
// ------

class TableCompiler_MSSQL extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  createQuery(columns, ifNot) {
    const createStatement = ifNot
      ? `if object_id('${this.tableName()}', 'U') is null CREATE TABLE `
      : 'CREATE TABLE ';
    const sql =
      createStatement +
      this.tableName() +
      (this._formatting ? ' (\n    ' : ' (') +
      columns.sql.join(this._formatting ? ',\n    ' : ', ') +
      ')';

    if (this.single.comment) {
      const { comment } = this.single;
      // XXX: This is a byte limit, not character, so we cannot definitively say they'll exceed the limit without database collation info.
      if (comment.length > 7500 / 2)
        this.client.logger.warn(
          'Your comment might be longer than the max comment length for MSSQL of 7,500 bytes.'
        );
    }

    this.pushQuery(sql);
  }

  // Compiles column add.  Multiple columns need only one ADD clause (not one ADD per column) so core addColumns doesn't work.  #1348
  addColumns(columns, prefix) {
    prefix = prefix || this.addColumnsPrefix;

    if (columns.sql.length > 0) {
      this.pushQuery({
        sql:
          (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') +
          this.tableName() +
          ' ' +
          prefix +
          columns.sql.join(', '),
        bindings: columns.bindings,
      });
    }
  }

  alterColumns(columns, colBuilder) {
    for (let i = 0, l = colBuilder.length; i < l; i++) {
      const builder = colBuilder[i];
      if (builder.modified.defaultTo) {
        const schema = this.schemaNameRaw || 'dbo';
        const baseQuery = `
              DECLARE @constraint varchar(100) = (SELECT default_constraints.name
                                                  FROM sys.all_columns
                                                  INNER JOIN sys.tables
                                                    ON all_columns.object_id = tables.object_id
                                                  INNER JOIN sys.schemas
                                                    ON tables.schema_id = schemas.schema_id
                                                  INNER JOIN sys.default_constraints
                                                    ON all_columns.default_object_id = default_constraints.object_id
                                                  WHERE schemas.name = '${schema}'
                                                  AND tables.name = '${
                                                    this.tableNameRaw
                                                  }'
                                                  AND all_columns.name = '${builder.getColumnName()}')

              IF @constraint IS NOT NULL EXEC('ALTER TABLE ${
                this.tableNameRaw
              } DROP CONSTRAINT ' + @constraint)`;
        this.pushQuery(baseQuery);
      }
    }
    // in SQL server only one column can be altered at a time
    columns.sql.forEach((sql) => {
      this.pushQuery({
        sql:
          (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') +
          this.tableName() +
          ' ' +
          (this.lowerCase
            ? this.alterColumnPrefix.toLowerCase()
            : this.alterColumnPrefix) +
          sql,
        bindings: columns.bindings,
      });
    });
  }

  // Compiles column drop.  Multiple columns need only one DROP clause (not one DROP per column) so core dropColumn doesn't work.  #1348
  dropColumn() {
    const _this2 = this;
    const columns = helpers.normalizeArr.apply(null, arguments);
    const columnsArray = Array.isArray(columns) ? columns : [columns];
    const drops = columnsArray.map((column) => _this2.formatter.wrap(column));
    const schema = this.schemaNameRaw || 'dbo';

    for (const column of columns) {
      const baseQuery = `
              DECLARE @constraint varchar(100) = (SELECT default_constraints.name
                                                  FROM sys.all_columns
                                                  INNER JOIN sys.tables
                                                    ON all_columns.object_id = tables.object_id
                                                  INNER JOIN sys.schemas
                                                    ON tables.schema_id = schemas.schema_id
                                                  INNER JOIN sys.default_constraints
                                                    ON all_columns.default_object_id = default_constraints.object_id
                                                  WHERE schemas.name = '${schema}'
                                                  AND tables.name = '${this.tableNameRaw}'
                                                  AND all_columns.name = '${column}')

              IF @constraint IS NOT NULL EXEC('ALTER TABLE ${this.tableNameRaw} DROP CONSTRAINT ' + @constraint)`;
      this.pushQuery(baseQuery);
    }
    this.pushQuery(
      (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') +
        this.tableName() +
        ' ' +
        this.dropColumnPrefix +
        drops.join(', ')
    );
  }

  // Compiles the comment on the table.
  comment() {}

  changeType() {}

  // Renames a column on the table.
  renameColumn(from, to) {
    this.pushQuery(
      `exec sp_rename ${this.client.parameter(
        this.tableName() + '.' + from,
        this.tableBuilder,
        this.bindingsHolder
      )}, ${this.client.parameter(
        to,
        this.tableBuilder,
        this.bindingsHolder
      )}, 'COLUMN'`
    );
  }

  dropFKRefs(runner, refs) {
    const formatter = this.client.formatter(this.tableBuilder);
    return Promise.all(
      refs.map(function (ref) {
        const constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
        const tableName = formatter.wrap(ref.TABLE_NAME);
        return runner.query({
          sql: `ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`,
        });
      })
    );
  }

  createFKRefs(runner, refs) {
    const formatter = this.client.formatter(this.tableBuilder);

    return Promise.all(
      refs.map(function (ref) {
        const tableName = formatter.wrap(ref.TABLE_NAME);
        const keyName = formatter.wrap(ref.CONSTRAINT_NAME);
        const column = formatter.columnize(ref.COLUMN_NAME);
        const references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
        const inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
        const onUpdate = ` ON UPDATE ${ref.UPDATE_RULE}`;
        const onDelete = ` ON DELETE ${ref.DELETE_RULE}`;

        return runner.query({
          sql:
            `ALTER TABLE ${tableName} ADD CONSTRAINT ${keyName}` +
            ' FOREIGN KEY (' +
            column +
            ') REFERENCES ' +
            inTable +
            ' (' +
            references +
            ')' +
            onUpdate +
            onDelete,
        });
      })
    );
  }

  index(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(
      `CREATE INDEX ${indexName} ON ${this.tableName()} (${this.formatter.columnize(
        columns
      )})`
    );
  }

  primary(columns, constraintName) {
    constraintName = constraintName
      ? this.formatter.wrap(constraintName)
      : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    if (!this.forCreate) {
      this.pushQuery(
        `ALTER TABLE ${this.tableName()} ADD CONSTRAINT ${constraintName} PRIMARY KEY (${this.formatter.columnize(
          columns
        )})`
      );
    } else {
      this.pushQuery(
        `CONSTRAINT ${constraintName} PRIMARY KEY (${this.formatter.columnize(
          columns
        )})`
      );
    }
  }

  unique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);

    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    const whereAllTheColumnsAreNotNull = columns
      .map((column) => this.formatter.columnize(column) + ' IS NOT NULL')
      .join(' AND ');

    // make unique constraint that allows null https://stackoverflow.com/a/767702/360060
    // to be more or less compatible with other DBs (if any of the columns is NULL then "duplicates" are allowed)
    this.pushQuery(
      `CREATE UNIQUE INDEX ${indexName} ON ${this.tableName()} (${this.formatter.columnize(
        columns
      )}) WHERE ${whereAllTheColumnsAreNotNull}`
    );
  }

  // Compile a drop index command.
  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`DROP INDEX ${indexName} ON ${this.tableName()}`);
  }

  // Compile a drop foreign key command.
  dropForeign(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(
      `ALTER TABLE ${this.tableName()} DROP CONSTRAINT ${indexName}`
    );
  }

  // Compile a drop primary key command.
  dropPrimary(constraintName) {
    constraintName = constraintName
      ? this.formatter.wrap(constraintName)
      : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(
      `ALTER TABLE ${this.tableName()} DROP CONSTRAINT ${constraintName}`
    );
  }

  // Compile a drop unique key command.
  dropUnique(column, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery(`DROP INDEX ${indexName} ON ${this.tableName()}`);
  }
}

TableCompiler_MSSQL.prototype.createAlterTableMethods = ['foreign', 'primary'];
TableCompiler_MSSQL.prototype.lowerCase = false;

TableCompiler_MSSQL.prototype.addColumnsPrefix = 'ADD ';
TableCompiler_MSSQL.prototype.dropColumnPrefix = 'DROP COLUMN ';
TableCompiler_MSSQL.prototype.alterColumnPrefix = 'ALTER COLUMN ';

module.exports = TableCompiler_MSSQL;
