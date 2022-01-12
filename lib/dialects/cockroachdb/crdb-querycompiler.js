const QueryCompiler_PG = require('../postgres/query/pg-querycompiler');
const {
  columnize: columnize_,
  wrap: wrap_,
  operator: operator_,
} = require('../../formatter/wrappingFormatter');

class QueryCompiler_CRDB extends QueryCompiler_PG {
  truncate() {
    return `truncate ${this.tableName}`;
  }

  upsert() {
    let sql = this._upsert();
    if (sql === '') return sql;
    const { returning } = this.single;
    if (returning) sql += this._returning(returning);
    return {
      sql: sql,
      returning,
    };
  }

  _upsert() {
    const upsertValues = this.single.upsert || [];
    const sql = this.with() + `upsert into ${this.tableName} `;
    const body = this._insertBody(upsertValues);
    return body === '' ? '' : sql + body;
  }

  whereJsonPath(statement) {
    let castValue = '';
    if (parseInt(statement.value)) {
      castValue = '::int';
    } else if (parseFloat(statement.value)) {
      castValue = '::float';
    } else {
      castValue = " #>> '{}'";
    }
    return `json_extract_path(${this._columnClause(
      statement
    )}, ${this.client.toArrayPathFromJsonPath(
      statement.jsonPath,
      this.builder,
      this.bindingsHolder
    )})${castValue} ${operator_(
      statement.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    )} ${this._jsonValueClause(statement)}`;
  }

  // Json common functions
  _jsonExtract(nameFunction, params) {
    let extractions;
    if (Array.isArray(params.column)) {
      extractions = params.column;
    } else {
      extractions = [params];
    }
    return extractions
      .map((extraction) => {
        const jsonCol = `json_extract_path(${columnize_(
          extraction.column || extraction[0],
          this.builder,
          this.client,
          this.bindingsHolder
        )}, ${this.client.toArrayPathFromJsonPath(
          extraction.path || extraction[1],
          this.builder,
          this.bindingsHolder
        )})`;
        const alias = extraction.alias || extraction[2];
        return alias
          ? this.client.alias(jsonCol, this.formatter.wrap(alias))
          : jsonCol;
      })
      .join(', ');
  }

  _onJsonPathEquals(nameJoinFunction, clause) {
    return (
      'json_extract_path(' +
      wrap_(
        clause.columnFirst,
        undefined,
        this.builder,
        this.client,
        this.bindingsHolder
      ) +
      ', ' +
      this.client.toArrayPathFromJsonPath(
        clause.jsonPathFirst,
        this.builder,
        this.bindingsHolder
      ) +
      ') = json_extract_path(' +
      wrap_(
        clause.columnSecond,
        undefined,
        this.builder,
        this.client,
        this.bindingsHolder
      ) +
      ', ' +
      this.client.toArrayPathFromJsonPath(
        clause.jsonPathSecond,
        this.builder,
        this.bindingsHolder
      ) +
      ')'
    );
  }
}

module.exports = QueryCompiler_CRDB;
