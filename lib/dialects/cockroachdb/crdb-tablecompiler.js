/* eslint max-len: 0 */

const TableCompiler = require('../postgres/schema/pg-tablecompiler');
const { isObject } = require('../../util/is');

class TableCompiler_CRDB extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  addColumns(columns, prefix, colCompilers) {
    if (prefix === this.alterColumnsPrefix) {
      // alter columns
      for (const col of colCompilers) {
        this.client.logger.warn(
          'Experimental alter column in use, see issue: https://github.com/cockroachdb/cockroach/issues/49329'
        );
        this.pushQuery({
          sql: 'SET enable_experimental_alter_column_type_general = true',
          bindings: [],
        });
        super._addColumn(col);
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
    this.pushQuery(`drop index ${this.tableName()}@${indexName} cascade`);
  }

  dropUniqueIfExists(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(
      `drop index if exists ${this.tableName()}@${indexName} cascade`
    );
  }

  unique(columns, indexname) {
    if (isObject(indexname)) {
      const { nullsNotDistinct } = indexname;
      if (nullsNotDistinct !== undefined) {
        throw new Error(
          'cockroachdb cannot make unique with nullsNotDistinct option'
        );
      }
    }

    return super.unique(columns, indexname);
  }
}

module.exports = TableCompiler_CRDB;
