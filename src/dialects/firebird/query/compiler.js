// Firebird Query Compiler
// ------
import inherits from 'inherits';
import QueryCompiler from '../../../query/compiler';

import { assign, compact, isEmpty, identity } from 'lodash';

const components = [
  'limit',
  'columns',
  'join',
  'where',
  'union',
  'group',
  'having',
  'order',
  'offset',
  'lock',
];

function QueryCompiler_Firebird(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_Firebird, QueryCompiler);

assign(QueryCompiler_Firebird.prototype, {
  _emptyInsertValue: '() values ()',
  // InsertValue: '() values ()',

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const insertValues = this.single.insert || [];
    let sql = 'insert into ' + this.tableName + ' ';
    const { returning } = this.single;
    const returningSql = returning
      ? this._returning('insert', returning) + ' '
      : '';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning,
      };
    }

    const insertData = this._prepInsert(insertValues);
    sql += `(${this.formatter.columnize(insertData.columns)}) values (`;
    if (typeof insertData === 'string') {
      sql += `${insertData} ${returningSql}`;
    } else {
      if (insertData.columns.length) {
        let i = -1;
        while (++i < insertData.values.length) {
          if (i !== 0)
            sql +=
              ` insert into ${this.tableName} (` +
              `${this.formatter.columnize(insertData.columns)}) values (`;
          sql += `${this.formatter.parameterize(
            insertData.values[i]
          )}) ${returningSql};`;
        }
        // sql += ' end';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue;
      } else {
        sql = '';
      }
    }

    // if (sql) {
    //   sql = 'execute block as begin ' + sql;
    // }

    return {
      sql: sql,
      returning: returning,
    };
  },

  // Update method, including joins, wheres, order & limits.
  update() {
    const join = this.join();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const { returning } = this.single;
    // const limit = this.limit();
    return (
      `update ${this.tableName}` +
      (join ? ` ${join}` : '') +
      ' set ' +
      updates.join(', ') +
      (where ? ` ${where}` : '') +
      (order ? ` ${order}` : '') +
      (returning ? ` ${this._returning('update', returning) + ''}` : '')
      // (limit ? ` ${limit}` : '')
    );
  },

  // Compiles a `delete` query.
  del() {
    // Make sure tableName is processed by the formatter first.
    const { tableName } = this;
    const { returning } = this.single;
    const wheres = this.where();
    return (
      `delete from ${tableName}` +
      (wheres ? ` ${wheres}` : '') +
      (returning ? ` ${this._returning('del', returning) + ''}` : '')
    );
  },

  // Compiles the `select` statement, or nested sub-selects by calling each of
  // the component compilers, trimming out the empties, and returning a
  // generated query string.
  select() {
    let sql = this.with();
    sql += 'select ';

    const statements = components.map((component) => this[component](this));
    sql += compact(statements).join(' ');
    return sql;
  },

  // Compiles the columns in the query, specifying if an item was distinct.
  columns() {
    let distinct = false;
    if (this.onlyUnions()) return '';
    const columns = this.grouped.columns || [];
    let i = -1,
      sql = [];
    if (columns) {
      while (++i < columns.length) {
        const stmt = columns[i];
        if (stmt.distinct) distinct = true;
        if (stmt.type === 'aggregate') {
          sql.push(this.aggregate(stmt));
        } else if (stmt.type === 'aggregateRaw') {
          sql.push(this.aggregateRaw(stmt));
        } else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value));
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    return (
      `${distinct ? 'distinct ' : ''}` +
      sql.join(', ') +
      (this.tableName
        ? ` from ${this.single.only ? 'only ' : ''}${this.tableName}`
        : '')
    );
  },

  // Compiles a `columnInfo` query.
  columnInfo() {
    const column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql: [
        'SELECT',
        'RF.RDB$FIELD_NAME COLUMN_NAME,',
        'CASE F.RDB$FIELD_TYPE',
        'WHEN 7 THEN',
        'CASE F.RDB$FIELD_SUB_TYPE',
        "WHEN 0 THEN 'SMALLINT'",
        "WHEN 1 THEN 'NUMERIC(' || F.RDB$FIELD_PRECISION || ', ' || (-F.RDB$FIELD_SCALE) || ')'",
        "WHEN 2 THEN 'DECIMAL'",
        'END',
        'WHEN 8 THEN',
        'CASE F.RDB$FIELD_SUB_TYPE',
        "WHEN 0 THEN 'INTEGER'",
        "WHEN 1 THEN 'NUMERIC('  || F.RDB$FIELD_PRECISION || ', ' || (-F.RDB$FIELD_SCALE) || ')'",
        "WHEN 2 THEN 'DECIMAL'",
        'END',
        "WHEN 9 THEN 'QUAD'",
        "WHEN 10 THEN 'FLOAT'",
        "WHEN 12 THEN 'DATE'",
        "WHEN 13 THEN 'TIME'",
        "WHEN 14 THEN 'CHAR'",
        'WHEN 16 THEN',
        'CASE F.RDB$FIELD_SUB_TYPE',
        "WHEN 0 THEN 'BIGINT'",
        "WHEN 1 THEN 'NUMERIC(' || F.RDB$FIELD_PRECISION || ', ' || (-F.RDB$FIELD_SCALE) || ')'",
        "WHEN 2 THEN 'DECIMAL'",
        'END',
        "WHEN 27 THEN 'DOUBLE'",
        "WHEN 35 THEN 'TIMESTAMP'",
        "WHEN 37 THEN 'VARCHAR'",
        "WHEN 40 THEN 'CSTRING' || (TRUNC(F.RDB$FIELD_LENGTH / CH.RDB$BYTES_PER_CHARACTER)) || ')'",
        "WHEN 45 THEN 'BLOB_ID'",
        "WHEN 261 THEN 'BLOB SUB_TYPE ' || F.RDB$FIELD_SUB_TYPE",
        "ELSE 'RDB$FIELD_TYPE: ' || F.RDB$FIELD_TYPE || '?'",
        'END DATA_TYPE,',
        '(TRUNC(F.RDB$FIELD_LENGTH / CH.RDB$BYTES_PER_CHARACTER)) CHARACTER_MAXIMUM_LENGTH,',
        "REPLACE(CAST(SUBSTRING(COALESCE(RF.RDB$DEFAULT_SOURCE, F.RDB$DEFAULT_SOURCE) FROM 1 FOR 32000) AS VARCHAR(32000)), 'DEFAULT ', '') COLUMN_DEFAULT,",
        "IIF(COALESCE(RF.RDB$NULL_FLAG, 0) = 0, 'YES', 'NO') IS_NULLABLE",
        'FROM RDB$RELATION_FIELDS RF',
        'JOIN RDB$FIELDS F ON (F.RDB$FIELD_NAME = RF.RDB$FIELD_SOURCE)',
        'LEFT OUTER JOIN RDB$CHARACTER_SETS CH ON (CH.RDB$CHARACTER_SET_ID = F.RDB$CHARACTER_SET_ID)',
        'WHERE (RF.RDB$RELATION_NAME = ?) AND (COALESCE(RF.RDB$SYSTEM_FLAG, 0) = 0);',
      ].join(' '),
      bindings: [table],
      output(resp) {
        const out = resp.reduce(function(columns, val) {
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
  },

  limit() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit) return '';

    return (
      'first ' +
      (noLimit
        ? '18446744073709551615'
        : this.formatter.parameter(this.single.limit))
    );
  },

  offset() {
    if (!this.single.offset) return '';

    return `skip ${this.formatter.parameter(this.single.offset)}`;
  },

  _returning: function _returning(method, value) {
    switch (method) {
      case 'update':
      case 'insert':
      case 'del':
        return value
          ? `returning ${this.formatter.columnizeWithPrefix('', value)}`
          : '';
      default:
        return '';
    }
  },
});

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
export default QueryCompiler_Firebird;
