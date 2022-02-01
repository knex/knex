// Redshift Query Builder & Compiler
// ------
const QueryCompiler = require('../../../query/querycompiler');
const QueryCompiler_PG = require('../../postgres/query/pg-querycompiler');

const identity = require('lodash/identity');
const {
  columnize: columnize_,
} = require('../../../formatter/wrappingFormatter');

class QueryCompiler_Redshift extends QueryCompiler_PG {
  truncate() {
    return `truncate ${this.tableName.toLowerCase()}`;
  }

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const sql = QueryCompiler.prototype.insert.apply(this, arguments);
    if (sql === '') return sql;
    this._slightReturn();
    return {
      sql,
    };
  }

  // Compiles an `update` query, warning on unsupported returning
  update() {
    const sql = QueryCompiler.prototype.update.apply(this, arguments);
    this._slightReturn();
    return {
      sql,
    };
  }

  // Compiles an `delete` query, warning on unsupported returning
  del() {
    const sql = QueryCompiler.prototype.del.apply(this, arguments);
    this._slightReturn();
    return {
      sql,
    };
  }

  // simple: if trying to return, warn
  _slightReturn() {
    if (this.single.isReturning) {
      this.client.logger.warn(
        'insert/update/delete returning is not supported by redshift dialect'
      );
    }
  }

  forUpdate() {
    this.client.logger.warn('table lock is not supported by redshift dialect');
    return '';
  }

  forShare() {
    this.client.logger.warn(
      'lock for share is not supported by redshift dialect'
    );
    return '';
  }

  forNoKeyUpdate() {
    this.client.logger.warn('table lock is not supported by redshift dialect');
    return '';
  }

  forKeyShare() {
    this.client.logger.warn(
      'lock for share is not supported by redshift dialect'
    );
    return '';
  }

  // Compiles a columnInfo query
  columnInfo() {
    const column = this.single.columnInfo;
    let schema = this.single.schema;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    if (schema) {
      schema = this.client.customWrapIdentifier(schema, identity);
    }

    const sql =
      'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    const bindings = [
      table.toLowerCase(),
      this.client.database().toLowerCase(),
    ];

    return this._buildColumnInfoQuery(schema, sql, bindings, column);
  }

  jsonExtract(params) {
    let extractions;
    if (Array.isArray(params.column)) {
      extractions = params.column;
    } else {
      extractions = [params];
    }
    return extractions
      .map((extraction) => {
        const jsonCol = `json_extract_path_text(${columnize_(
          extraction.column || extraction[0],
          this.builder,
          this.client,
          this.bindingsHolder
        )}, ${this.client.toPathForJson(
          params.path || extraction[1],
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

  jsonSet(params) {
    throw new Error('Json set is not supported by Redshift');
  }

  jsonInsert(params) {
    throw new Error('Json insert is not supported by Redshift');
  }

  jsonRemove(params) {
    throw new Error('Json remove is not supported by Redshift');
  }

  whereJsonPath(statement) {
    return this._whereJsonPath(
      'json_extract_path_text',
      Object.assign({}, statement, {
        path: this.client.toPathForJson(statement.path),
      })
    );
  }

  whereJsonSupersetOf(statement) {
    throw new Error('Json superset is not supported by Redshift');
  }

  whereJsonSubsetOf(statement) {
    throw new Error('Json subset is not supported by Redshift');
  }

  onJsonPathEquals(clause) {
    return this._onJsonPathEquals('json_extract_path_text', clause);
  }
}

module.exports = QueryCompiler_Redshift;
