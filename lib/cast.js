const ColumnCompiler_PG = require('./dialects/postgres/schema/pg-columncompiler');
const Raw = require('./raw');
const ColumnCompiler_MySQL = require('./dialects/mysql/schema/mysql-columncompiler');
const ColumnCompiler_MSSQL = require('./dialects/mssql/schema/mssql-columncompiler');
const ColumnCompiler_Oracledb = require('./dialects/oracledb/schema/oracledb-columncompiler');
const ColumnCompiler_Redshift = require('./dialects/redshift/schema/redshift-columncompiler');
const ColumnCompiler_SQLite3 = require('./dialects/sqlite3/schema/sqlite-columncompiler');
const {
  augmentWithBuilderInterface,
} = require('./builder-interface-augmenter');
const helpers = require('./util/helpers');

class Cast extends Raw {
  constructor(client) {
    super();
    this.client = client;
    this.value = null;
    this.to = '';
    this.alias = '';
  }

  cast(value, to, alias) {
    this.value = value;
    this.to = to;
    this.alias = alias;
    return this;
  }

  toString() {
    return this.toQuery();
  }

  _getColType(type) {
    const columnCompiler = this.client.getColumnCompiler();
    const typeName = columnCompiler.prototype[type];
    if (typeof typeName === 'function') {
      return typeName();
    }
    return typeName;
  }

  castDouble(value, alias) {
    return this.cast(value, this._getColType('double'), alias);
  }

  castChar(value, length, alias) {
    return this.cast(value, `char(${length})`, alias);
  }

  castJson(value, alias) {
    return this.cast(value, 'json', alias);
  }

  castJsonb(value, alias) {
    return this.cast(value, 'jsonb', alias);
  }

  castReal(value, alias) {
    return this.cast(value, this._getColType('floating'), alias);
  }

  castInt(value, alias) {
    return this.cast(value, this._getColType('integer'), alias);
  }

  castBigint(value, alias) {
    return this.cast(value, this._getColType('bigint'), alias);
  }

  castBinary(value, alias) {
    return this.cast(value, this._getColType('binary'), alias);
  }

  castText(value, alias) {
    return this.cast(value, this._getColType('text'), alias);
  }

  toSQL() {
    const { value, to, alias } = this;

    const formatter = this.client.formatter(this);

    const asAlias = alias ? ` as ${formatter.wrap(alias)}` : '';

    const sql = `cast(${this.client.parameter(
      value,
      formatter.builder,
      formatter
    )} as ${to})${asAlias}`;

    return {
      method: 'cast',
      sql: sql,
      bindings: formatter.bindings,
    };
  }
}

// Workaround to avoid circular dependency between wrappingFormatter.unwrapRaw and rawFormatter
Cast.prototype.isRawInstance = true;

// Allow the `Cast` object to be utilized with full access to the relevant
// promise API.
augmentWithBuilderInterface(Cast);
helpers.addQueryContext(Cast);

module.exports = Cast;
