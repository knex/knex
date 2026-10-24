// MariaDB Query Compiler
// -------
const QueryCompiler_MySQL = require('../../mysql/query/mysql-querycompiler');
const { wrap: wrap_ } = require('../../../formatter/wrappingFormatter');

class QueryCompiler_MariaDB extends QueryCompiler_MySQL {
  // On MariaDB, json_extract() yields a quoted JSON scalar (e.g. "cold") whose
  // values do not compare equal with `=`. json_unquote() is required for the
  // comparison to behave like MySQL's native JSON type
  onJsonPathEquals(clause) {
    const extract = (column, path) =>
      `json_unquote(json_extract(${wrap_(
        column,
        undefined,
        this.builder,
        this.client,
        this.bindingsHolder
      )}, ${this.client.parameter(path, this.builder, this.bindingsHolder)}))`;

    return `${extract(clause.columnFirst, clause.jsonPathFirst)} = ${extract(
      clause.columnSecond,
      clause.jsonPathSecond
    )}`;
  }

  insert() {
    const sql = super.insert();
    if (sql === '') return sql;
    const { returning } = this.single;
    if (returning && this._supportsReturning('insert')) {
      return { sql: sql + this._returning(returning), returning };
    }
    return sql;
  }

  update() {
    const sql = super.update();
    if (sql === '') return sql;
    const { returning } = this.single;
    if (returning && this._supportsReturning('update')) {
      return { sql: sql + this._returning(returning), returning };
    }
    return sql;
  }

  del() {
    const sql = super.del();
    if (sql === '') return sql;
    const { returning } = this.single;
    if (returning && this._supportsReturning('del')) {
      return { sql: sql + this._returning(returning), returning };
    }
    return sql;
  }

  _returning(value) {
    return value ? ` returning ${this.formatter.columnize(value)}` : '';
  }

  _supportsReturning(method) {
    // Assume that if the version doesn't exist, we're on the latest
    // (fail open and assume the user is building queries correctly)
    const version = parseFloat(this.client.version) ?? 13;
    if (version < 10.5) {
      return false;
    }
    if (method === 'update') {
      return version >= 13 && (this.grouped.join || []).length === 0;
    }
    if (method === 'del') {
      return (this.grouped.join || []).length === 0;
    }
    return true;
  }

  _returningCheck() {
    const { returning } = this.single;
    if (!returning || this._supportsReturning(this.method)) {
      return;
    }
    let reason;
    const hasJoin = (this.grouped.join || []).length;
    if (this.method === 'update') {
      reason = (this.grouped.join || []).length
        ? 'multi-table update statements'
        : 'mariadb versions older than 13.0';
    } else if (this.method === 'del' && hasJoin) {
      reason = 'multi-table delete statements';
    } else {
      reason = 'mariadb versions older than 10.5';
    }
    this.client.logger.warn(
      `.returning() is not supported for ${reason} and will not have any effect.`
    );
  }
}

module.exports = QueryCompiler_MariaDB;
