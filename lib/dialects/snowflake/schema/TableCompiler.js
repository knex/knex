// @ts-ignore
const TableCompiler_MySQL = require('../../mysql/schema/mysql-tablecompiler');

class TableCompiler extends TableCompiler_MySQL {
  constructor(client, builder) {
    super(client, builder);
  }

  index(columns, indexName, indexType) {
    // @ts-ignore
    this.client.logger.warn(
      'Snowflake does not support the creation of indexes.'
    );
  }

  dropIndex(columns, indexName) {
    // @ts-ignore
    this.client.logger.warn(
      'Snowflake does not support the deletion of indexes.'
    );
  }
}

module.exports = TableCompiler;
