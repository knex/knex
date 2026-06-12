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
}

module.exports = QueryCompiler_MariaDB;
