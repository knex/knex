const filter = require('lodash/filter');
const values = require('lodash/values');
const identity = require('lodash/identity');
const { isObject } = require('../../../util/is');

const TableCompiler = require('../../../schema/tablecompiler');
const { formatDefault } = require('../../../formatter/formatterUtils');

class TableCompiler_SQLite3 extends TableCompiler {
  constructor() {
    super(...arguments);
  }

  // Create a new table.
  createQuery(columns, ifNot, like) {
    const createStatement = ifNot
      ? 'create table if not exists '
      : 'create table ';

    let sql = createStatement + this.tableName();

    if (like && this.tableNameLike()) {
      sql += ' as select * from ' + this.tableNameLike() + ' where 0=1';
    } else {
      // so we will need to check for a primary key commands and add the columns
      // to the table's declaration here so they can be created on the tables.
      sql += ' (' + columns.sql.join(', ');
      sql += this.foreignKeys() || '';
      sql += this.primaryKeys() || '';
      sql += this._addChecks();
      sql += ')';
    }
    this.pushQuery(sql);

    if (like) {
      this.addColumns(columns, this.addColumnsPrefix);
    }
  }

  addColumns(columns, prefix, colCompilers) {
    if (prefix === this.alterColumnsPrefix) {
      const compiler = this;

      const columnsInfo = colCompilers.map((col) => {
        const name = this.client.customWrapIdentifier(
          col.getColumnName(),
          identity,
          col.columnBuilder.queryContext()
        );

        const type = col.getColumnType();

        const defaultTo = col.modified['defaultTo']
          ? formatDefault(col.modified['defaultTo'][0], col.type, this.client)
          : null;

        const notNull =
          col.modified['nullable'] && col.modified['nullable'][0] === false;

        return { name, type, defaultTo, notNull };
      });

      this.pushQuery({
        sql: `PRAGMA table_info(${this.tableName()})`,
        statementsProducer(pragma, connection) {
          return compiler.client
            .ddl(compiler, pragma, connection)
            .alterColumn(columnsInfo);
        },
      });
    } else {
      for (let i = 0, l = columns.sql.length; i < l; i++) {
        this.pushQuery({
          sql: `alter table ${this.tableName()} add column ${columns.sql[i]}`,
          bindings: columns.bindings[i],
        });
      }
    }
  }

  // Compile a drop unique key command.
  dropUnique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  }

  // Compile a drop foreign key command.
  dropForeign(columns, indexName) {
    const compiler = this;

    columns = Array.isArray(columns) ? columns : [columns];
    columns = columns.map((column) =>
      this.client.customWrapIdentifier(column, identity)
    );
    indexName = this.client.customWrapIdentifier(indexName, identity);

    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .dropForeign(columns, indexName);
      },
    });
  }

  // Compile a drop primary key command.
  dropPrimary(constraintName) {
    const compiler = this;

    constraintName = this.client.customWrapIdentifier(constraintName, identity);

    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .dropPrimary(constraintName);
      },
    });
  }

  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  }

  // Compile a unique key command.
  unique(columns, indexName) {
    let deferrable;
    let predicate;
    if (isObject(indexName)) {
      ({ indexName, deferrable, predicate } = indexName);
    }
    if (deferrable && deferrable !== 'not deferrable') {
      this.client.logger.warn(
        `sqlite3: unique index \`${indexName}\` will not be deferrable ${deferrable} because sqlite3 does not support deferred constraints.`
      );
    }
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);

    const predicateQuery = predicate
      ? ' ' + this.client.queryCompiler(predicate).where()
      : '';

    this.pushQuery(
      `create unique index ${indexName} on ${this.tableName()} (${columns})${predicateQuery}`
    );
  }

  // Compile a plain index key command.
  index(columns, indexName, options) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);

    let predicate;
    if (isObject(options)) {
      ({ predicate } = options);
    }
    const predicateQuery = predicate
      ? ' ' + this.client.queryCompiler(predicate).where()
      : '';
    this.pushQuery(
      `create index ${indexName} on ${this.tableName()} (${columns})${predicateQuery}`
    );
  }

  /**
   * Add a primary key to an existing table.
   *
   * @NOTE The `createQuery` method above handles table creation. Don't do anything regarding table
   *       creation in this method
   *
   * @param {string | string[]} columns - Column name(s) to assign as primary keys
   * @param {string} [constraintName] - Custom name for the PK constraint
   */
  primary(columns, constraintName) {
    const compiler = this;

    columns = Array.isArray(columns) ? columns : [columns];
    columns = columns.map((column) =>
      this.client.customWrapIdentifier(column, identity)
    );

    let deferrable;
    if (isObject(constraintName)) {
      ({ constraintName, deferrable } = constraintName);
    }
    if (deferrable && deferrable !== 'not deferrable') {
      this.client.logger.warn(
        `sqlite3: primary key constraint \`${constraintName}\` will not be deferrable ${deferrable} because sqlite3 does not support deferred constraints.`
      );
    }
    constraintName = this.client.customWrapIdentifier(constraintName, identity);

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
  }

  /**
   * Add a foreign key constraint to an existing table
   *
   * @NOTE The `createQuery` method above handles foreign key constraints on table creation. Don't do
   *       anything regarding table creation in this method
   *
   * @param {object} foreignInfo - Information about the current column foreign setup
   * @param {string | string[]} [foreignInfo.column] - Column in the current constraint
   * @param {string | undefined} foreignInfo.keyName - Name of the foreign key constraint
   * @param {string | string[]} foreignInfo.references - What column it references in the other table
   * @param {string} foreignInfo.inTable - What table is referenced in this constraint
   * @param {string} [foreignInfo.onUpdate] - What to do on updates
   * @param {string} [foreignInfo.onDelete] - What to do on deletions
   */
  foreign(foreignInfo) {
    const compiler = this;

    if (this.method !== 'create' && this.method !== 'createIfNot') {
      foreignInfo.column = Array.isArray(foreignInfo.column)
        ? foreignInfo.column
        : [foreignInfo.column];
      foreignInfo.column = foreignInfo.column.map((column) =>
        this.client.customWrapIdentifier(column, identity)
      );
      foreignInfo.inTable = this.client.customWrapIdentifier(
        foreignInfo.inTable,
        identity
      );
      foreignInfo.references = Array.isArray(foreignInfo.references)
        ? foreignInfo.references
        : [foreignInfo.references];
      foreignInfo.references = foreignInfo.references.map((column) =>
        this.client.customWrapIdentifier(column, identity)
      );

      this.pushQuery({
        sql: `PRAGMA table_info(${this.tableName()})`,
        statementsProducer(pragma, connection) {
          return compiler.client
            .ddl(compiler, pragma, connection)
            .foreign(foreignInfo);
        },
      });
    }
  }

  primaryKeys() {
    const pks = filter(this.grouped.alterTable || [], { method: 'primary' });
    if (pks.length > 0 && pks[0].args.length > 0) {
      const columns = pks[0].args[0];
      let constraintName = pks[0].args[1] || '';
      if (constraintName) {
        constraintName = ' constraint ' + this.formatter.wrap(constraintName);
      }
      const needUniqueCols =
        this.grouped.columns.filter((t) => t.builder._type === 'increments')
          .length > 0;
      // SQLite dont support autoincrement columns and composite primary keys (autoincrement is always primary key).
      // You need to add unique index instead when you have autoincrement columns (https://stackoverflow.com/a/6154876/1535159)
      return `,${constraintName} ${
        needUniqueCols ? 'unique' : 'primary key'
      } (${this.formatter.columnize(columns)})`;
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
      let constraintName = foreign.keyName || '';
      if (constraintName) {
        constraintName = ' constraint ' + this.formatter.wrap(constraintName);
      }
      sql += `,${constraintName} foreign key(${column}) references ${foreignTable}(${references})`;
      if (foreign.onDelete) sql += ` on delete ${foreign.onDelete}`;
      if (foreign.onUpdate) sql += ` on update ${foreign.onUpdate}`;
    }
    return sql;
  }

  createTableBlock() {
    return this.getColumns().concat().join(',');
  }

  renameColumn(from, to) {
    this.pushQuery({
      sql: `alter table ${this.tableName()} rename ${this.formatter.wrap(
        from
      )} to ${this.formatter.wrap(to)}`,
    });
  }

  _setNullableState(column, isNullable) {
    const compiler = this;

    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      statementsProducer(pragma, connection) {
        return compiler.client
          .ddl(compiler, pragma, connection)
          .setNullable(column, isNullable);
      },
    });
  }

  dropColumn() {
    const compiler = this;
    const columns = values(arguments);

    const columnsWrapped = columns.map((column) =>
      this.client.customWrapIdentifier(column, identity)
    );

    this.pushQuery({
      sql: `PRAGMA table_info(${this.tableName()})`,
      output(pragma) {
        return compiler.client
          .ddl(compiler, pragma, this.connection)
          .dropColumn(columnsWrapped);
      },
    });
  }
}

module.exports = TableCompiler_SQLite3;
