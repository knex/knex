/* eslint max-len: 0 */

// PostgreSQL Table Builder & Compiler
// -------

const has = require('lodash/has');
const TableCompiler = require('../../../schema/tablecompiler');
const { isObject } = require('../../../util/is');

class TableCompiler_PG extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  // Compile a rename column command.
  renameColumn(from, to) {
    return this.pushQuery({
      sql: `alter table ${this.tableName()} rename ${this.formatter.wrap(
        from
      )} to ${this.formatter.wrap(to)}`,
    });
  }

  compileAdd(builder) {
    const table = this.formatter.wrap(builder);
    const columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: `alter table ${table} ${columns.join(', ')}`,
    });
  }

  // Adds the "create" query to the query sequence.
  createQuery(columns, ifNot) {
    const createStatement = ifNot
      ? 'create table if not exists '
      : 'create table ';
    let sql =
      createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';
    if (this.single.inherits)
      sql += ` inherits (${this.formatter.wrap(this.single.inherits)})`;
    this.pushQuery({
      sql,
      bindings: columns.bindings,
    });
    const hasComment = has(this.single, 'comment');
    if (hasComment) this.comment(this.single.comment);
  }

  addColumns(columns, prefix, colCompilers) {
    if (prefix === this.alterColumnsPrefix) {
      // alter columns
      for (const col of colCompilers) {
        const quotedTableName = this.tableName();
        const type = col.getColumnType();
        // We'd prefer to call this.formatter.wrapAsIdentifier here instead, however the context passed to
        // `this` instance is not that of the column, but of the table. Thus, we unfortunately have to call
        // `wrapIdentifier` here as well (it is already called once on the initial column operation) to give
        // our `alter` operation the correct `queryContext`. Refer to issue #2606 and PR #2612.
        const colName = this.client.wrapIdentifier(
          col.getColumnName(),
          col.columnBuilder.queryContext()
        );

        // To alter enum columns they must be cast to text first
        const isEnum = col.type === 'enu';

        this.pushQuery({
          sql: `alter table ${quotedTableName} alter column ${colName} drop default`,
          bindings: [],
        });
        this.pushQuery({
          sql: `alter table ${quotedTableName} alter column ${colName} drop not null`,
          bindings: [],
        });
        this.pushQuery({
          sql: `alter table ${quotedTableName} alter column ${colName} type ${type} using (${colName}${
            isEnum ? '::text::' : '::'
          }${type})`,
          bindings: [],
        });

        const defaultTo = col.modified['defaultTo'];
        if (defaultTo) {
          const modifier = col.defaultTo.apply(col, defaultTo);
          this.pushQuery({
            sql: `alter table ${quotedTableName} alter column ${colName} set ${modifier}`,
            bindings: [],
          });
        }

        const nullable = col.modified['nullable'];
        if (nullable && nullable[0] === false) {
          this.pushQuery({
            sql: `alter table ${quotedTableName} alter column ${colName} set not null`,
            bindings: [],
          });
        }
      }
    } else {
      // base class implementation for normal add
      super.addColumns(columns, prefix);
    }
  }

  // Compiles the comment on the table.
  comment(comment) {
    this.pushQuery(
      `comment on table ${this.tableName()} is '${this.single.comment}'`
    );
  }

  // Indexes:
  // -------

  primary(columns, constraintName) {
    let deferrable;
    if (isObject(constraintName)) {
      ({ constraintName, deferrable } = constraintName);
    }
    deferrable = deferrable ? ` deferrable initially ${deferrable}` : '';
    constraintName = constraintName
      ? this.formatter.wrap(constraintName)
      : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(
      `alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(
        columns
      )})${deferrable}`
    );
  }

  unique(columns, indexName) {
    let deferrable;
    if (isObject(indexName)) {
      ({ indexName, deferrable } = indexName);
    }
    deferrable = deferrable ? ` deferrable initially ${deferrable}` : '';
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(
      `alter table ${this.tableName()} add constraint ${indexName}` +
        ' unique (' +
        this.formatter.columnize(columns) +
        ')' +
        deferrable
    );
  }

  index(columns, indexName, indexType) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(
      `create index ${indexName} on ${this.tableName()}${
        (indexType && ` using ${indexType}`) || ''
      }` +
        ' (' +
        this.formatter.columnize(columns) +
        ')'
    );
  }

  dropPrimary(constraintName) {
    constraintName = constraintName
      ? this.formatter.wrap(constraintName)
      : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${constraintName}`
    );
  }

  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    indexName = this.schemaNameRaw
      ? `${this.formatter.wrap(this.schemaNameRaw)}.${indexName}`
      : indexName;
    this.pushQuery(`drop index ${indexName}`);
  }

  dropUnique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${indexName}`
    );
  }

  dropForeign(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${indexName}`
    );
  }
}

module.exports = TableCompiler_PG;
