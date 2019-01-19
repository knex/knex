'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var components = [
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
]; // Firebird Query Compiler
// ------

function QueryCompiler_Firebird(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_Firebird, _compiler2.default);

(0, _lodash.assign)(QueryCompiler_Firebird.prototype, {
  _emptyInsertValue: '() values ()',
  // InsertValue: '() values ()',

  forUpdate: function forUpdate() {
    return 'FOR UPDATE WITH LOCK';
  },
  forShare: function forShare() {
    return 'WITH LOCK';
  },

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var sql = 'insert into ' + this.tableName + ' ';
    var returning = this.single.returning;

    var returningSql = returning
      ? this._returning('insert', returning) + ' '
      : '';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if (
      (typeof insertValues === 'undefined'
        ? 'undefined'
        : (0, _typeof3.default)(insertValues)) === 'object' &&
      (0, _lodash.isEmpty)(insertValues)
    ) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning: returning,
      };
    }

    var insertData = this._prepInsert(insertValues);
    sql += '(' + this.formatter.columnize(insertData.columns) + ') values (';
    if (typeof insertData === 'string') {
      sql += insertData + ' ' + returningSql;
    } else {
      if (insertData.columns.length) {
        var i = -1;
        while (++i < insertData.values.length) {
          if (i !== 0)
            sql +=
              ' insert into ' +
              this.tableName +
              ' (' +
              (this.formatter.columnize(insertData.columns) + ') values (');
          sql +=
            this.formatter.parameterize(insertData.values[i]) +
            ') ' +
            returningSql +
            ';';
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
  update: function update() {
    var join = this.join();
    var updates = this._prepUpdate(this.single.update);
    var where = this.where();
    var order = this.order();
    var returning = this.single.returning;
    // const limit = this.limit();

    return (
      'update ' +
      this.tableName +
      (join ? ' ' + join : '') +
      ' set ' +
      updates.join(', ') +
      (where ? ' ' + where : '') +
      (order ? ' ' + order : '') +
      (returning ? ' ' + (this._returning('update', returning) + '') : '')
      // (limit ? ` ${limit}` : '')
    );
  },

  // Compiles a `delete` query.
  del: function del() {
    // Make sure tableName is processed by the formatter first.
    var tableName = this.tableName;
    var returning = this.single.returning;

    var wheres = this.where();
    return (
      'delete from ' +
      tableName +
      (wheres ? ' ' + wheres : '') +
      (returning ? ' ' + (this._returning('del', returning) + '') : '')
    );
  },

  // Compiles the `select` statement, or nested sub-selects by calling each of
  // the component compilers, trimming out the empties, and returning a
  // generated query string.
  select: function select() {
    var _this = this;

    var sql = this.with();
    sql += 'select ';

    var statements = components.map(function(component) {
      return _this[component](_this);
    });
    sql += (0, _lodash.compact)(statements).join(' ');
    return sql;
  },

  // Compiles the columns in the query, specifying if an item was distinct.
  columns: function columns() {
    var distinct = false;
    if (this.onlyUnions()) return '';
    var columns = this.grouped.columns || [];
    var i = -1,
      sql = [];
    if (columns) {
      while (++i < columns.length) {
        var stmt = columns[i];
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
      '' +
      (distinct ? 'distinct ' : '') +
      sql.join(', ') +
      (this.tableName
        ? ' from ' + (this.single.only ? 'only ' : '') + this.tableName
        : '')
    );
  },

  // Compiles a `columnInfo` query.
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    var table = this.client.customWrapIdentifier(
      this.single.table,
      _lodash.identity
    );

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
      output: function output(resp) {
        var out = resp.reduce(function(columns, val) {
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
  limit: function limit() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit) return '';

    return (
      'first ' +
      (noLimit
        ? '18446744073709551615'
        : this.formatter.parameter(this.single.limit))
    );
  },
  offset: function offset() {
    if (!this.single.offset) return '';

    return 'skip ' + this.formatter.parameter(this.single.offset);
  },
  havingBasic: function havingBasic(statement) {
    var column = this.formatter.wrap(statement.column);
    var operator = this.formatter.operator(statement.operator);
    var value = this.formatter.parameter(statement.value);

    if (operator === 'like' || operator === 'not like') {
      column = 'lower(' + column + ')';
      value = 'lower(' + value + ')';
    }

    return this._not(statement, '') + column + ' ' + operator + ' ' + value;
  },
  onBasic: function onBasic(clause) {
    var column = this.formatter.wrap(clause.column);
    var operator = this.formatter.operator(clause.operator);
    var value = this.formatter.wrap(clause.value);

    if (operator === 'like' || operator === 'not like') {
      column = 'lower(' + column + ')';
      value = 'lower(' + value + ')';
    }

    return column + ' ' + operator + ' ' + value;
  },

  // Compiles a basic "where" clause.
  whereBasic: function whereBasic(statement) {
    var column = this.formatter.wrap(statement.column);
    var operator = this.formatter.operator(statement.operator);
    var value = this.formatter.parameter(statement.value);

    if (operator === 'like' || operator === 'not like') {
      column = 'lower(' + column + ')';
      value = 'lower(' + value + ')';
    }

    return this._not(statement, '') + column + ' ' + operator + ' ' + value;
  },

  _returning: function _returning(method, value) {
    switch (method) {
      case 'update':
      case 'insert':
      case 'del':
        return value
          ? 'returning ' + this.formatter.columnizeWithPrefix('', value)
          : '';
      default:
        return '';
    }
  },
});

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
exports.default = QueryCompiler_Firebird;
module.exports = exports['default'];
