/* eslint max-len:0 */

const utils = require('../utils');
const TableCompiler = require('../../../schema/tablecompiler');
const helpers = require('../../../util/helpers');
const Trigger = require('./internal/trigger');
const { isObject } = require('../../../util/is');

// Table Compiler
// ------

class TableCompiler_Oracle extends TableCompiler {
  constructor() {
    super(...arguments);
  }

  addColumns(columns, prefix) {
    if (columns.sql.length > 0) {
      prefix = prefix || this.addColumnsPrefix;

      const columnSql = columns.sql;
      const alter = this.lowerCase ? 'alter table ' : 'ALTER TABLE ';

      let sql = `${alter}${this.tableName()} ${prefix}`;
      if (columns.sql.length > 1) {
        sql += `(${columnSql.join(', ')})`;
      } else {
        sql += columnSql.join(', ');
      }

      this.pushQuery({
        sql,
        bindings: columns.bindings,
      });
    }
  }

  // Compile a rename column command.
  renameColumn(from, to) {
    // Remove quotes around tableName
    const tableName = this.tableName().slice(1, -1);
    return this.pushQuery(
      Trigger.renameColumnTrigger(this.client.logger, tableName, from, to)
    );
  }

  compileAdd(builder) {
    const table = this.formatter.wrap(builder);
    const columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: `alter table ${table} ${columns.join(', ')}`,
    });
  }

  // Adds the "create" query to the query sequence.
  createQuery(columns, ifNot, like) {
    const columnsSql =
      like && this.tableNameLike()
        ? ' as (select * from ' + this.tableNameLike() + ' where 0=1)'
        : ' (' + columns.sql.join(', ') + ')';
    const sql = `create table ${this.tableName()}${columnsSql}`;

    this.pushQuery({
      // catch "name is already used by an existing object" for workaround for "if not exists"
      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
      bindings: columns.bindings,
    });
    if (this.single.comment) this.comment(this.single.comment);
  }

  // Compiles the comment on the table.
  comment(comment) {
    this.pushQuery(`comment on table ${this.tableName()} is '${comment}'`);
  }

  dropColumn() {
    const columns = helpers.normalizeArr.apply(null, arguments);
    this.pushQuery(
      `alter table ${this.tableName()} drop (${this.formatter.columnize(
        columns
      )})`
    );
  }

  changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  }

  _indexCommand(type, tableName, columns) {
    return this.formatter.wrap(
      utils.generateCombinedName(this.client.logger, type, tableName, columns)
    );
  }

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

  dropPrimary(constraintName) {
    constraintName = constraintName
      ? this.formatter.wrap(constraintName)
      : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery(
      `alter table ${this.tableName()} drop constraint ${constraintName}`
    );
  }

  index(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(
      `create index ${indexName} on ${this.tableName()}` +
        ' (' +
        this.formatter.columnize(columns) +
        ')'
    );
  }

  dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
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

TableCompiler_Oracle.prototype.addColumnsPrefix = 'add ';
TableCompiler_Oracle.prototype.alterColumnsPrefix = 'modify ';

module.exports = TableCompiler_Oracle;
