/* eslint max-len: 0 */

const TableCompiler = require('../postgres/schema/pg-tablecompiler');

class TableCompiler_CRDB extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  dropUnique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${this.tableName()}@${indexName} cascade `);
  }
}

module.exports = TableCompiler_CRDB;
