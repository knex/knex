// @ts-ignore
import * as TableCompiler_MySQL from '../mysql/schema/mysql-tablecompiler';

export class TableCompiler extends TableCompiler_MySQL {
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
