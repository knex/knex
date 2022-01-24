// MySQL Query Compiler
// ------
const identity = require('lodash/identity');
const QueryCompiler = require('../../../query/querycompiler');
const { wrapAsIdentifier } = require('../../../formatter/formatterUtils');
const {
  columnize: columnize_,
  wrap: wrap_,
} = require('../../../formatter/wrappingFormatter');

class QueryCompiler_MySQL extends QueryCompiler {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);

    const { returning } = this.single;
    if (returning) {
      this.client.logger.warn(
        '.returning() is not supported by mysql and will not have any effect.'
      );
    }

    this._emptyInsertValue = '() values ()';
  }

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    let sql = super.insert();
    if (sql === '') return sql;

    const { ignore, merge, insert } = this.single;
    if (ignore) sql = sql.replace('insert into', 'insert ignore into');
    if (merge) {
      sql += this._merge(merge.updates, insert);
      const wheres = this.where();
      if (wheres) {
        throw new Error(
          '.onConflict().merge().where() is not supported for mysql'
        );
      }
    }

    return sql;
  }

  // Compiles merge for onConflict, allowing for different merge strategies
  _merge(updates, insert) {
    const sql = ' on duplicate key update ';
    if (updates && Array.isArray(updates)) {
      // update subset of columns
      return (
        sql +
        updates
          .map((column) =>
            wrapAsIdentifier(column, this.formatter.builder, this.client)
          )
          .map((column) => `${column} = values(${column})`)
          .join(', ')
      );
    } else if (updates && typeof updates === 'object') {
      const updateData = this._prepUpdate(updates);
      return sql + updateData.join(',');
    } else {
      const insertData = this._prepInsert(insert);
      if (typeof insertData === 'string') {
        throw new Error(
          'If using merge with a raw insert query, then updates must be provided'
        );
      }

      return (
        sql +
        insertData.columns
          .map((column) => wrapAsIdentifier(column, this.builder, this.client))
          .map((column) => `${column} = values(${column})`)
          .join(', ')
      );
    }
  }

  // Update method, including joins, wheres, order & limits.
  update() {
    const join = this.join();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    return (
      `update ${this.tableName}` +
      (join ? ` ${join}` : '') +
      ' set ' +
      updates.join(', ') +
      (where ? ` ${where}` : '') +
      (order ? ` ${order}` : '') +
      (limit ? ` ${limit}` : '')
    );
  }

  forUpdate() {
    return 'for update';
  }

  forShare() {
    return 'lock in share mode';
  }

  // Only supported on MySQL 8.0+
  skipLocked() {
    return 'skip locked';
  }

  // Supported on MySQL 8.0+ and MariaDB 10.3.0+
  noWait() {
    return 'nowait';
  }

  // Compiles a `columnInfo` query.
  columnInfo() {
    const column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
      bindings: [table, this.client.database()],
      output(resp) {
        const out = resp.reduce(function (columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE,
            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
            nullable: val.IS_NULLABLE === 'YES',
          };
          return columns;
        }, {});
        return (column && out[column]) || out;
      },
    };
  }

  limit() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only.
    // see: http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
    const limit =
      this.single.offset && noLimit
        ? '18446744073709551615'
        : this._getValueOrParameterFromAttribute('limit');
    return `limit ${limit}`;
  }

  whereLike(statement) {
    return `${this._columnClause(statement)} ${this._not(
      statement,
      'like '
    )}${this._valueClause(statement)} COLLATE utf8_bin`;
  }

  whereILike(statement) {
    return `${this._columnClause(statement)} ${this._not(
      statement,
      'like '
    )}${this._valueClause(statement)}`;
  }

  // Json functions
  jsonExtract(params) {
    return this._jsonExtract(['json_extract', 'json_unquote'], params);
  }

  jsonSet(params) {
    return this._jsonSet('json_set', params);
  }

  jsonInsert(params) {
    return this._jsonSet('json_insert', params);
  }

  jsonRemove(params) {
    const jsonCol = `json_remove(${columnize_(
      params.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )},${this.client.parameter(
      params.path,
      this.builder,
      this.bindingsHolder
    )})`;
    return params.alias
      ? this.client.alias(jsonCol, this.formatter.wrap(params.alias))
      : jsonCol;
  }

  whereJsonObject(statement) {
    return this._not(
      statement,
      `json_contains(${this._columnClause(statement)}, ${this._jsonValueClause(
        statement
      )})`
    );
  }

  whereJsonPath(statement) {
    return this._whereJsonPath('json_extract', statement);
  }

  whereJsonSupersetOf(statement) {
    return this._not(
      statement,
      `json_contains(${wrap_(
        statement.column,
        undefined,
        this.builder,
        this.client,
        this.bindingsHolder
      )},${this._jsonValueClause(statement)})`
    );
  }

  whereJsonSubsetOf(statement) {
    return this._not(
      statement,
      `json_contains(${this._jsonValueClause(statement)},${wrap_(
        statement.column,
        undefined,
        this.builder,
        this.client,
        this.bindingsHolder
      )})`
    );
  }

  onJsonPathEquals(clause) {
    return this._onJsonPathEquals('json_extract', clause);
  }
}

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_MySQL;
