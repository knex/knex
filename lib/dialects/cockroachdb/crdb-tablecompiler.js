/* eslint max-len: 0 */

const TableCompiler = require('../postgres/schema/pg-tablecompiler');

class TableCompiler_CRDB extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
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
        this.client.logger.warn(
          'Experimental alter column in use, see issue: https://github.com/cockroachdb/cockroach/issues/49329'
        );
        this.pushQuery({
          sql: 'SET enable_experimental_alter_column_type_general = true',
          bindings: [],
        });
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

  dropUnique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${this.tableName()}@${indexName} cascade `);
  }
}

module.exports = TableCompiler_CRDB;
