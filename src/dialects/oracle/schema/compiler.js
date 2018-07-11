// Oracle Schema Compiler
// -------
import { SchemaCompiler } from '../../../schema/compiler';
import * as utils from '../utils';
import { trigger } from './trigger';

export class SchemaCompiler_Oracle extends SchemaCompiler {
  // Rename a table on the schema.
  renameTable(tableName, to) {
    const renameTable = trigger.renameTableAndAutoIncrementTrigger(
      this.client.logger,
      tableName,
      to
    );
    this.pushQuery(renameTable);
  }

  // Check whether a table exists on the query.
  hasTable(tableName) {
    this.pushQuery({
      sql:
        'select TABLE_NAME from USER_TABLES where TABLE_NAME = ' +
        this.formatter.parameter(tableName),
      output(resp) {
        return resp.length > 0;
      },
    });
  }

  // Check whether a column exists on the schema.
  hasColumn(tableName, column) {
    const sql =
      `select COLUMN_NAME from USER_TAB_COLUMNS ` +
      `where TABLE_NAME = ${this.formatter.parameter(tableName)} ` +
      `and COLUMN_NAME = ${this.formatter.parameter(column)}`;
    this.pushQuery({ sql, output: (resp) => resp.length > 0 });
  }

  dropSequenceIfExists(sequenceName) {
    this.pushQuery(
      utils.wrapSqlWithCatch(
        `drop sequence ${this.formatter.wrap(sequenceName)}`,
        -2289
      )
    );
  }

  _dropRelatedSequenceIfExists(tableName) {
    // removing the sequence that was possibly generated by increments() column
    const sequenceName = utils.generateCombinedName(
      this.client.logger,
      'seq',
      tableName
    );
    this.dropSequenceIfExists(sequenceName);
  }

  dropTable(tableName) {
    this.pushQuery(`drop table ${this.formatter.wrap(tableName)}`);

    // removing the sequence that was possibly generated by increments() column
    this._dropRelatedSequenceIfExists(tableName);
  }

  dropTableIfExists(tableName) {
    this.pushQuery(
      utils.wrapSqlWithCatch(
        `drop table ${this.formatter.wrap(tableName)}`,
        -942
      )
    );

    // removing the sequence that was possibly generated by increments() column
    this._dropRelatedSequenceIfExists(tableName);
  }
}

export default SchemaCompiler_Oracle;
