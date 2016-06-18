
// Oracle Query Builder & Compiler
// ------
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var QueryCompiler = require('../../../query/compiler');
var helpers = require('../../../helpers');
var assign = require('lodash/object/assign');
var ReturningHelper = require('../utils').ReturningHelper;

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_Oracle(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_Oracle, QueryCompiler);

assign(QueryCompiler_Oracle.prototype, {

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var returning = this.single.returning;

    if (!Array.isArray(insertValues) && _.isPlainObject(this.single.insert)) {
      insertValues = [this.single.insert];
    }

    // always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    if (Array.isArray(insertValues) && insertValues.length === 1 && _.isEmpty(insertValues[0])) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
    }

    if (_.isEmpty(this.single.insert) && typeof this.single.insert !== 'function') {
      return '';
    }

    var insertData = this._prepInsert(insertValues);

    var sql = {};

    if (_.isString(insertData)) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
    }

    if (insertData.values.length === 1) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
    }

    var insertDefaultsOnly = insertData.columns.length === 0;

    sql.sql = 'begin ' + _.map(insertData.values, function (value) {
      var returningHelper;
      var parameterizedValues = !insertDefaultsOnly ? this.formatter.parameterize(value) : '';
      var returningValues = Array.isArray(returning) ? returning : [returning];
      var subSql = 'insert into ' + this.tableName + ' ';

      if (returning) {
        returningHelper = new ReturningHelper(returningValues.join(':'));
        sql.outParams = (sql.outParams || []).concat(returningHelper);
      }

      if (insertDefaultsOnly) {
        // no columns given so only the default value
        subSql += '(' + this.formatter.wrap(this.single.returning) + ') values (default)';
      } else {
        subSql += '(' + this.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')';
      }
      subSql += returning ? ' returning ROWID into ' + this.formatter.parameter(returningHelper) : '';

      // pre bind position because subSql is an execute immediate parameter
      // later position binding will only convert the ? params
      subSql = this.formatter.client.positionBindings(subSql);
      return 'execute immediate \'' + subSql.replace(/'/g, "''") + (parameterizedValues || returning ? '\' using ' : '') + parameterizedValues + (parameterizedValues && returning ? ', ' : '') + (returning ? 'out ?' : '') + ';';
    }, this).join(' ') + 'end;';

    if (returning) {
      sql.returning = returning;
      // generate select statement with special order by to keep the order because 'in (..)' may change the order
      sql.returningSql = 'select ' + this.formatter.columnize(returning) + ' from ' + this.tableName + ' where ROWID in (' + sql.outParams.map(function (v, i) {
        return ':' + (i + 1);
      }).join(', ') + ')' + ' order by case ROWID ' + sql.outParams.map(function (v, i) {
        return 'when CHARTOROWID(:' + (i + 1) + ') then ' + i;
      }).join(' ') + ' end';
    }

    return sql;
  },

  // Update method, including joins, wheres, order & limits.
  update: function update() {
    var updates = this._prepUpdate(this.single.update);
    var where = this.where();
    return 'update ' + this.tableName + ' set ' + updates.join(', ') + (where ? ' ' + where : '');
  },

  // Compiles a `truncate` query.
  truncate: function truncate() {
    return 'truncate table ' + this.tableName;
  },

  forUpdate: function forUpdate() {
    return 'for update';
  },

  forShare: function forShare() {
    // lock for share is not directly supported by oracle
    // use LOCK TABLE .. IN SHARE MODE; instead
    helpers.warn('lock for share is not supported by oracle dialect');
    return '';
  },

  // Compiles a `columnInfo` query.
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;
    return {
      sql: 'select COLUMN_NAME, DATA_TYPE, CHAR_COL_DECL_LENGTH, NULLABLE from USER_TAB_COLS where TABLE_NAME = :1',
      bindings: [this.single.table],
      output: function output(resp) {
        var out = _.reduce(resp, function (columns, val) {
          columns[val.COLUMN_NAME] = {
            type: val.DATA_TYPE,
            maxLength: val.CHAR_COL_DECL_LENGTH,
            nullable: val.NULLABLE === 'Y'
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  },

  select: function select() {
    var statements = _.map(components, function (component) {
      return this[component]();
    }, this);
    var query = _.compact(statements).join(' ');
    return this._surroundQueryWithLimitAndOffset(query);
  },

  aggregate: function aggregate(stmt) {
    var val = stmt.value;
    var splitOn = val.toLowerCase().indexOf(' as ');
    var distinct = stmt.aggregateDistinct ? 'distinct ' : '';
    // Allows us to speciy an alias for the aggregate types.
    if (splitOn !== -1) {
      var col = val.slice(0, splitOn);
      var alias = val.slice(splitOn + 4);
      return stmt.method + '(' + distinct + this.formatter.wrap(col) + ') ' + this.formatter.wrap(alias);
    }
    return stmt.method + '(' + distinct + this.formatter.wrap(val) + ')';
  },

  // for single commands only
  _addReturningToSqlAndConvert: function _addReturningToSqlAndConvert(sql, returning, tableName) {
    var res = {
      sql: sql
    };

    if (!returning) {
      return res;
    }

    var returningValues = Array.isArray(returning) ? returning : [returning];
    var returningHelper = new ReturningHelper(returningValues.join(':'));
    res.sql = sql + ' returning ROWID into ' + this.formatter.parameter(returningHelper);
    res.returningSql = 'select ' + this.formatter.columnize(returning) + ' from ' + tableName + ' where ROWID = :1';
    res.outParams = [returningHelper];
    res.returning = returning;
    return res;
  },

  _surroundQueryWithLimitAndOffset: function _surroundQueryWithLimitAndOffset(query) {
    var limit = this.single.limit;
    var offset = this.single.offset;
    var hasLimit = limit || limit === 0 || limit === '0';
    limit = +limit;

    if (!hasLimit && !offset) return query;
    query = query || "";

    if (hasLimit && !offset) {
      return "select * from (" + query + ") where rownum <= " + this.formatter.parameter(limit);
    }

    var endRow = +offset + (hasLimit ? limit : 10000000000000);

    return "select * from " + "(select row_.*, ROWNUM rownum_ from (" + query + ") row_ " + "where rownum <= " + this.formatter.parameter(endRow) + ") " + "where rownum_ > " + this.formatter.parameter(offset);
  }

});

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler_Oracle.prototype.first = QueryCompiler_Oracle.prototype.select;

var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'lock'];

module.exports = QueryCompiler_Oracle;