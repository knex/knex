'use strict';

exports.__esModule = true;

var _compact2 = require('lodash/compact');

var _compact3 = _interopRequireDefault(_compact2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _utils = require('../utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint max-len:0 */

// Oracle Query Builder & Compiler
// ------
var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'lock'];

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_Oracle(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_Oracle, _compiler2.default);

(0, _assign3.default)(QueryCompiler_Oracle.prototype, {

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var _this = this;

    var insertValues = this.single.insert || [];
    var returning = this.single.returning;


    if (!Array.isArray(insertValues) && (0, _isPlainObject3.default)(this.single.insert)) {
      insertValues = [this.single.insert];
    }

    // always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    if (Array.isArray(insertValues) && insertValues.length === 1 && (0, _isEmpty3.default)(insertValues[0])) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
    }

    if ((0, _isEmpty3.default)(this.single.insert) && typeof this.single.insert !== 'function') {
      return '';
    }

    var insertData = this._prepInsert(insertValues);

    var sql = {};

    if ((0, _isString3.default)(insertData)) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
    }

    if (insertData.values.length === 1) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
    }

    var insertDefaultsOnly = insertData.columns.length === 0;

    sql.sql = 'begin ' + (0, _map3.default)(insertData.values, function (value) {
      var returningHelper = void 0;
      var parameterizedValues = !insertDefaultsOnly ? _this.formatter.parameterize(value, _this.client.valueForUndefined) : '';
      var returningValues = Array.isArray(returning) ? returning : [returning];
      var subSql = 'insert into ' + _this.tableName + ' ';

      if (returning) {
        returningHelper = new _utils.ReturningHelper(returningValues.join(':'));
        sql.outParams = (sql.outParams || []).concat(returningHelper);
      }

      if (insertDefaultsOnly) {
        // no columns given so only the default value
        subSql += '(' + _this.formatter.wrap(_this.single.returning) + ') values (default)';
      } else {
        subSql += '(' + _this.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')';
      }
      subSql += returning ? ' returning ROWID into ' + _this.formatter.parameter(returningHelper) : '';

      // pre bind position because subSql is an execute immediate parameter
      // later position binding will only convert the ? params

      subSql = _this.formatter.client.positionBindings(subSql);

      var parameterizedValuesWithoutDefault = parameterizedValues.replace('DEFAULT, ', '').replace(', DEFAULT', '');
      return 'execute immediate \'' + subSql.replace(/'/g, "''") + (parameterizedValuesWithoutDefault || returning ? '\' using ' : '') + parameterizedValuesWithoutDefault + (parameterizedValuesWithoutDefault && returning ? ', ' : '') + (returning ? 'out ?' : '') + ';';
    }).join(' ') + 'end;';

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
    var returning = this.single.returning;

    var sql = 'update ' + this.tableName + ' set ' + updates.join(', ') + (where ? ' ' + where : '');

    if (!returning) {
      return sql;
    }

    // always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    return this._addReturningToSqlAndConvert(sql, returning, this.tableName);
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
        var out = (0, _reduce3.default)(resp, function (columns, val) {
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
    var _this2 = this;

    var query = this.with();
    var statements = (0, _map3.default)(components, function (component) {
      return _this2[component]();
    });
    query += (0, _compact3.default)(statements).join(' ');
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
    var returningHelper = new _utils.ReturningHelper(returningValues.join(':'));
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
      return 'select * from (' + query + ') where rownum <= ' + this.formatter.parameter(limit);
    }

    var endRow = +offset + (hasLimit ? limit : 10000000000000);

    return "select * from " + "(select row_.*, ROWNUM rownum_ from (" + query + ") row_ " + "where rownum <= " + this.formatter.parameter(endRow) + ") " + "where rownum_ > " + this.formatter.parameter(offset);
  }
});

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler_Oracle.prototype.first = QueryCompiler_Oracle.prototype.select;

exports.default = QueryCompiler_Oracle;
module.exports = exports['default'];