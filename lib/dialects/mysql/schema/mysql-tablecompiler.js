/* eslint max-len:0*/

// MySQL Table Builder & Compiler
// -------
const TableCompiler = require('../../../schema/tablecompiler');
const { isObject, isString } = require('../../../util/is');

// Table Compiler
// ------

class TableCompiler_MySQL extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  createQuery(columns, ifNot, like) {
    const createStatement = ifNot
      ? 'create table if not exists '
      : 'create table ';
    const { client } = this;
    let conn = {};
    let columnsSql = ' (' + columns.sql.join(', ');

    columnsSql += this.primaryKeys() || '';
    columnsSql += this._addChecks();
    columnsSql += ')';

    let sql =
      createStatement +
      this.tableName() +
      (like && this.tableNameLike()
        ? ' like ' + this.tableNameLike()
        : columnsSql);

    // Check if the connection settings are set.
    if (client.connectionSettings) {
      conn = client.connectionSettings;
    }

    const charset = this.single.charset || conn.charset || '';
    const collation = this.single.collate || conn.collate || '';
    const engine = this.single.engine || '';

    if (charset && !like) sql += ` default character set ${charset}`;
    if (collation) sql += ` collate ${collation}`;
    if (engine) sql += ` engine = ${engine}`;

    if (this.single.comment) {
      const comment = this.single.comment || '';
      const MAX_COMMENT_LENGTH = 1024;
      if (comment.length > MAX_COMMENT_LENGTH)
        this.client.logger.warn(
          `The max length for a table comment is ${MAX_COMMENT_LENGTH} characters`
        );
      sql += ` comment = '${comment}'`;
    }

    this.pushQuery(sql);
    if (like) {
      this.addColumns(columns, this.addColumnsPrefix);
    }
  }

  // Compiles the comment on the table.
  comment(comment) {
    this.pushQuery(`alter table ${this.tableName()} comment = '${comment}'`);
  }

  changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  }

  // Renames a column on the table.
  renameColumn(from, to) {
    const compiler = this;
    const table = this.tableName();
    const wrapped = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);

    this.pushQuery({
      sql:
        `show full fields from ${table} where field = ` +
        this.client.parameter(from, this.tableBuilder, this.bindingsHolder),
      output(resp) {
        const column = resp[0];
        const runner = this;
        return compiler.getFKRefs(runner).then(([refs]) =>
          new Promise((resolve, reject) => {
            try {
              if (!refs.length) {
                resolve();
              }
              resolve(compiler.dropFKRefs(runner, refs));
            } catch (e) {
              reject(e);
            }
          })
            .then(function () {
              let sql = `alter table ${table} change ${wrapped} ${column.Type}`;

              if (String(column.Null).toUpperCase() !== 'YES') {
                sql += ` NOT NULL`;
              } else {
                // This doesn't matter for most cases except Timestamp, where this is important
                sql += ` NULL`;
              }
              if (column.Default !== void 0 && column.Default !== null) {
                sql += ` DEFAULT '${column.Default}'`;
              }
              if (column.Collation !== void 0 && column.Collation !== null) {
                sql += ` COLLATE '${column.Collation}'`;
              }
              // Add back the auto increment if the column  it, fix issue #2767
              if (column.Extra == 'auto_increment') {
                sql += ` AUTO_INCREMENT`;
              }

              return runner.query({
                sql,
              });
            })
            .then(function () {
              if (!refs.length) {
                return;
              }
              return compiler.createFKRefs(
                runner,
                refs.map(function (ref) {
                  if (ref.REFERENCED_COLUMN_NAME === from) {
                    ref.REFERENCED_COLUMN_NAME = to;
                  }
                  if (ref.COLUMN_NAME === from) {
                    ref.COLUMN_NAME = to;
                  }
                  return ref;
                })
              );
            })
        );
      },
    });
  }

  primaryKeys() {
    const pks = (this.grouped.alterTable || []).filter(
      (k) => k.method === 'primary'
    );
    if (pks.length > 0 && pks[0].args.length > 0) {
      const columns = pks[0].args[0];
      let constraintName = pks[0].args[1] || '';
      if (constraintName) {
        constraintName = ' constraint ' + this.formatter.wrap(constraintName);
      }

      if (this.grouped.columns) {
        const incrementsCols = this._getIncrementsColumnNames();
        if (incrementsCols.length) {
          incrementsCols.forEach((c) => {
            if (!columns.includes(c)) {
              columns.unshift(c);
            }
          });
        }
        const bigIncrementsCols = this._getBigIncrementsColumnNames();
        if (bigIncrementsCols.length) {
          bigIncrementsCols.forEach((c) => {
            if (!columns.includes(c)) {
              columns.unshift(c);
            }
          });
        }
      }

      return `,${constraintName} primary key (${this.formatter.columnize(
        columns
      )})`;
    }
  }

  getFKRefs(runner) {
    const bindingsHolder = {
      bindings: [],
    };

    const sql =
      'SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, ' +
      '       KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME, ' +
      '       RC.UPDATE_RULE, RC.DELETE_RULE ' +
      'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU ' +
      'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC ' +
      '       USING(CONSTRAINT_NAME)' +
      'WHERE KCU.REFERENCED_TABLE_NAME = ' +
      this.client.parameter(
        this.tableNameRaw,
        this.tableBuilder,
        bindingsHolder
      ) +
      ' ' +
      '  AND KCU.CONSTRAINT_SCHEMA = ' +
      this.client.parameter(
        this.client.database(),
        this.tableBuilder,
        bindingsHolder
      ) +
      ' ' +
      '  AND RC.CONSTRAINT_SCHEMA = ' +
      this.client.parameter(
        this.client.database(),
        this.tableBuilder,
        bindingsHolder
      );

    return runner.query({
      sql,
      bindings: bindingsHolder.bindings,
    });
  }

  dropFKRefs(runner, refs) {
    const formatter = this.client.formatter(this.tableBuilder);

    return Promise.all(
      refs.map(function (ref) {
        const constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
        const tableName = formatter.wrap(ref.TABLE_NAME);
        return runner.query({
          sql: `alter table ${tableName} drop foreign key ${constraintName}`,
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
            `alter table ${tableName} add constraint ${keyName} ` +
            'foreign key (' +
            column +
            ') references ' +
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

  index(columns, indexName, options) {
    let storageEngineIndexType;
    let indexType;

    if (isString(options)) {
      indexType = options;
    } else if (isObject(options)) {
      ({ indexType, storageEngineIndexType } = options);
    }

    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    storageEngineIndexType = storageEngineIndexType
      ? ` using ${storageEngineIndexType}`
      : '';
    this.pushQuery(
      `alter table ${this.tableName()} add${
        indexType ? ` ${indexType}` : ''
      } index ${indexName}(${this.formatter.columnize(
        columns
      )})${storageEngineIndexType}`
    );
  }

  primary(columns, constraintName) {
    let deferrable;
    if (isObject(constraintName)) {
      ({ constraintName, deferrable } = constraintName);
    }
    if (deferrable && deferrable !== 'not deferrable') {
      this.client.logger.warn(
        `mysql: primary key constraint \`${constraintName}\` will not be deferrable ${deferrable} because mysql does not support deferred constraints.`
      );
    }
    constraintName = constraintName
      ? this.formatter.wrap(constraintName)
      : this.formatter.wrap(`${this.tableNameRaw}_pkey`);

    const primaryCols = columns;
    let incrementsCols = [];
    let bigIncrementsCols = [];
    if (this.grouped.columns) {
      incrementsCols = this._getIncrementsColumnNames();
      if (incrementsCols) {
        incrementsCols.forEach((c) => {
          if (!primaryCols.includes(c)) {
            primaryCols.unshift(c);
          }
        });
      }
      bigIncrementsCols = this._getBigIncrementsColumnNames();
      if (bigIncrementsCols) {
        bigIncrementsCols.forEach((c) => {
          if (!primaryCols.includes(c)) {
            primaryCols.unshift(c);
          }
        });
      }
    }
    if (this.method !== 'create' && this.method !== 'createIfNot') {
      this.pushQuery(
        `alter table ${this.tableName()} add primary key ${constraintName}(${this.formatter.columnize(
          primaryCols
        )})`
      );
    }
    if (incrementsCols.length) {
      this.pushQuery(
        `alter table ${this.tableName()} modify column ${this.formatter.columnize(
          incrementsCols
        )} int unsigned not null auto_increment`
      );
    }
    if (bigIncrementsCols.length) {
      this.pushQuery(
        `alter table ${this.tableName()} modify column ${this.formatter.columnize(
          bigIncrementsCols
        )} bigint unsigned not null auto_increment`
      );
    }
  }

  unique(columns, indexName) {
    let storageEngineIndexType;
    let deferrable;
    if (isObject(indexName)) {
      ({ indexName, deferrable, storageEngineIndexType } = indexName);
    }
    if (deferrable && deferrable !== 'not deferrable') {
      this.client.logger.warn(
        `mysql: unique index \`${indexName}\` will not be deferrable ${deferrable} because mysql does not support deferred constraints.`
      );
    }
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    storageEngineIndexType = storageEngineIndexType
      ? ` using ${storageEngineIndexType}`
      : '';
    this.pushQuery(
      `alter table ${this.tableName()} add unique ${indexName}(${this.formatter.columnize(
        columns
      )})${storageEngineIndexType}`
    );
  }

  // Compile a drop index command.
  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} drop index ${indexName}`);
  }

  // Compile a drop foreign key command.
  dropForeign(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(
      `alter table ${this.tableName()} drop foreign key ${indexName}`
    );
  }

  // Compile a drop primary key command.
  dropPrimary() {
    this.pushQuery(`alter table ${this.tableName()} drop primary key`);
  }

  // Compile a drop unique key command.
  dropUnique(column, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery(`alter table ${this.tableName()} drop index ${indexName}`);
  }
}

TableCompiler_MySQL.prototype.addColumnsPrefix = 'add ';
TableCompiler_MySQL.prototype.alterColumnsPrefix = 'modify ';
TableCompiler_MySQL.prototype.dropColumnPrefix = 'drop ';

module.exports = TableCompiler_MySQL;
