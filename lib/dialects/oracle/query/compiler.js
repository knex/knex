/* eslint max-len:0 */

// Oracle Query Builder & Compiler
// ------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _queryCompiler = require('../../../query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _utils = require('../utils');

var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'lock'];

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_Oracle(client, builder) {
  _queryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_Oracle, _queryCompiler2['default']);

_lodash.assign(QueryCompiler_Oracle.prototype, {

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var _this = this;

    var insertValues = this.single.insert || [];
    var returning = this.single.returning;

    if (!Array.isArray(insertValues) && _lodash.isPlainObject(this.single.insert)) {
      insertValues = [this.single.insert];
    }

    // always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    if (Array.isArray(insertValues) && insertValues.length === 1 && _lodash.isEmpty(insertValues[0])) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
    }

    if (_lodash.isEmpty(this.single.insert) && typeof this.single.insert !== 'function') {
      return '';
    }

    var insertData = this._prepInsert(insertValues);

    var sql = {};

    if (_lodash.isString(insertData)) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
    }

    if (insertData.values.length === 1) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
    }

    var insertDefaultsOnly = insertData.columns.length === 0;

    sql.sql = 'begin ' + _lodash.map(insertData.values, function (value) {
      var returningHelper = undefined;
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
        var out = _lodash.reduce(resp, function (columns, val) {
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

    var statements = _lodash.map(components, function (component) {
      return _this2[component]();
    });
    var query = _lodash.compact(statements).join(' ');
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

exports['default'] = QueryCompiler_Oracle;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvcXVlcnkvY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O3NCQUkrRSxRQUFROzt3QkFDbEUsVUFBVTs7Ozs2QkFDTCx5QkFBeUI7Ozs7dUJBQzFCLGtCQUFrQjs7SUFBL0IsT0FBTzs7cUJBQ2EsVUFBVTs7QUFFMUMsSUFBTSxVQUFVLEdBQUcsQ0FDakIsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FDeEUsQ0FBQzs7Ozs7Ozs7QUFRRixTQUFTLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDN0MsNkJBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7Q0FDMUM7QUFDRCxzQkFBUyxvQkFBb0IsNkJBQWdCLENBQUE7O0FBRTdDLGVBQU8sb0JBQW9CLENBQUMsU0FBUyxFQUFFOzs7O0FBSXJDLFFBQU0sRUFBQSxrQkFBRzs7O0FBQ1AsUUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFBO1FBQ3JDLFNBQVMsR0FBSyxJQUFJLENBQUMsTUFBTSxDQUF6QixTQUFTOztBQUVmLFFBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLHNCQUFjLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDckUsa0JBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7S0FDcEM7OztBQUdELFFBQUksU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUMxQyxlQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUN6Qjs7QUFFRCxRQUFJLEtBQUssQ0FBQyxPQUFPLENB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Iiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG1heC1sZW46MCAqL1xuXG4vLyBPcmFjbGUgUXVlcnkgQnVpbGRlciAmIENvbXBpbGVyXG4vLyAtLS0tLS1cbmltcG9ydCB7IGFzc2lnbiwgaXNQbGFpbk9iamVjdCwgaXNFbXB0eSwgaXNTdHJpbmcsIG1hcCwgcmVkdWNlLCBjb21wYWN0IH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBRdWVyeUNvbXBpbGVyIGZyb20gJy4uLy4uLy4uL3F1ZXJ5L2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vLi4vLi4vaGVscGVycyc7XG5pbXBvcnQgeyBSZXR1cm5pbmdIZWxwZXIgfSBmcm9tICcuLi91dGlscyc7XG5cbmNvbnN0IGNvbXBvbmVudHMgPSBbXG4gICdjb2x1bW5zJywgJ2pvaW4nLCAnd2hlcmUnLCAndW5pb24nLCAnZ3JvdXAnLCAnaGF2aW5nJywgJ29yZGVyJywgJ2xvY2snXG5dO1xuXG4vLyBRdWVyeSBDb21waWxlclxuLy8gLS0tLS0tLVxuXG4vLyBTZXQgdGhlIFwiRm9ybWF0dGVyXCIgdG8gdXNlIGZvciB0aGUgcXVlcmllcyxcbi8vIGVuc3VyaW5nIHRoYXQgYWxsIHBhcmFtZXRlcml6ZWQgdmFsdWVzIChldmVuIGFjcm9zcyBzdWItcXVlcmllcylcbi8vIGFyZSBwcm9wZXJseSBidWlsdCBpbnRvIHRoZSBzYW1lIHF1ZXJ5LlxuZnVuY3Rpb24gUXVlcnlDb21waWxlcl9PcmFjbGUoY2xpZW50LCBidWlsZGVyKSB7XG4gIFF1ZXJ5Q29tcGlsZXIuY2FsbCh0aGlzLCBjbGllbnQsIGJ1aWxkZXIpXG59XG5pbmhlcml0cyhRdWVyeUNvbXBpbGVyX09yYWNsZSwgUXVlcnlDb21waWxlcilcblxuYXNzaWduKFF1ZXJ5Q29tcGlsZXJfT3JhY2xlLnByb3RvdHlwZSwge1xuXG4gIC8vIENvbXBpbGVzIGFuIFwiaW5zZXJ0XCIgcXVlcnksIGFsbG93aW5nIGZvciBtdWx0aXBsZVxuICAvLyBpbnNlcnRzIHVzaW5nIGEgc2luZ2xlIHF1ZXJ5IHN0YXRlbWVudC5cbiAgaW5zZXJ0KCkge1xuICAgIGxldCBpbnNlcnRWYWx1ZXMgPSB0aGlzLnNpbmdsZS5pbnNlcnQgfHwgW11cbiAgICBsZXQgeyByZXR1cm5pbmcgfSA9IHRoaXMuc2luZ2xlO1xuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGluc2VydFZhbHVlcykgJiYgaXNQbGFpbk9iamVjdCh0aGlzLnNpbmdsZS5pbnNlcnQpKSB7XG4gICAgICBpbnNlcnRWYWx1ZXMgPSBbdGhpcy5zaW5nbGUuaW5zZXJ0XVxuICAgIH1cblxuICAgIC8vIGFsd2F5cyB3cmFwIHJldHVybmluZyBhcmd1bWVudCBpbiBhcnJheVxuICAgIGlmIChyZXR1cm5pbmcgJiYgIUFycmF5LmlzQXJyYXkocmV0dXJuaW5nKSkge1xuICAgICAgcmV0dXJuaW5nID0gW3JldHVybmluZ107XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5zZXJ0VmFsdWVzKSAmJiBpbnNlcnRWYWx1ZXMubGVuZ3RoID09PSAxICYmIGlzRW1wdHkoaW5zZXJ0VmFsdWVzWzBdKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FkZFJldHVybmluZ1RvU3FsQW5kQ29udmVydChgaW5zZXJ0IGludG8gJHt0aGlzLnRhYmxlTmFtZX0gKCR7dGhpcy5mb3JtYXR0ZXIud3JhcCh0aGlzLnNpbmdsZS5yZXR1cm5pbmcpfSkgdmFsdWVzIChkZWZhdWx0KWAsIHJldHVybmluZywgdGhpcy50YWJsZU5hbWUpO1xuICAgIH1cblxuICAgIGlmIChpc0VtcHR5KHRoaXMuc2luZ2xlLmluc2VydCkgJiYgdHlwZW9mIHRoaXMuc2luZ2xlLmluc2VydCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGluc2VydERhdGEgPSB0aGlzLl9wcmVwSW5zZXJ0KGluc2VydFZhbHVlcyk7XG5cbiAgICBjb25zdCBzcWwgPSB7fTtcblxuICAgIGlmIChpc1N0cmluZyhpbnNlcnREYXRhKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FkZFJldHVybmluZ1RvU3FsQW5kQ29udmVydChgaW5zZXJ0IGludG8gJHt0aGlzLnRhYmxlTmFtZX0gJHtpbnNlcnREYXRhfWAsIHJldHVybmluZyk7XG4gICAgfVxuXG4gICAgaWYgKGluc2VydERhdGEudmFsdWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FkZFJldHVybmluZ1RvU3FsQW5kQ29udmVydChgaW5zZXJ0IGludG8gJHt0aGlzLnRhYmxlTmFtZX0gKCR7dGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKGluc2VydERhdGEuY29sdW1ucyl9KSB2YWx1ZXMgKCR7dGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyaXplKGluc2VydERhdGEudmFsdWVzWzBdKX0pYCwgcmV0dXJuaW5nLCB0aGlzLnRhYmxlTmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5zZXJ0RGVmYXVsdHNPbmx5ID0gKGluc2VydERhdGEuY29sdW1ucy5sZW5ndGggPT09IDApO1xuXG4gICAgc3FsLnNxbCA9ICdiZWdpbiAnICsgbWFwKGluc2VydERhdGEudmFsdWVzLCAodmFsdWUpID0+IHtcbiAgICAgIGxldCByZXR1cm5pbmdIZWxwZXI7XG4gICAgICBjb25zdCBwYXJhbWV0ZXJpemVkVmFsdWVzID0gIWluc2VydERlZmF1bHRzT25seSA/IHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcml6ZSh2YWx1ZSwgdGhpcy5jbGllbnQudmFsdWVGb3JVbmRlZmluZWQpIDogJyc7XG4gICAgICBjb25zdCByZXR1cm5pbmdWYWx1ZXMgPSBBcnJheS5pc0FycmF5KHJldHVybmluZykgPyByZXR1cm5pbmcgOiBbcmV0dXJuaW5nXTtcbiAgICAgIGxldCBzdWJTcWwgPSBgaW5zZXJ0IGludG8gJHt0aGlzLnRhYmxlTmFtZX0gYDtcblxuICAgICAgaWYgKHJldHVybmluZykge1xuICAgICAgICByZXR1cm5pbmdIZWxwZXIgPSBuZXcgUmV0dXJuaW5nSGVscGVyKHJldHVybmluZ1ZhbHVlcy5qb2luKCc6JykpO1xuICAgICAgICBzcWwub3V0UGFyYW1zID0gKHNxbC5vdXRQYXJhbXMgfHwgW10pLmNvbmNhdChyZXR1cm5pbmdIZWxwZXIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5zZXJ0RGVmYXVsdHNPbmx5KSB7XG4gICAgICAgIC8vIG5vIGNvbHVtbnMgZ2l2ZW4gc28gb25seSB0aGUgZGVmYXVsdCB2YWx1ZVxuICAgICAgICBzdWJTcWwgKz0gYCgke3RoaXMuZm9ybWF0dGVyLndyYXAodGhpcy5zaW5nbGUucmV0dXJuaW5nKX0pIHZhbHVlcyAoZGVmYXVsdClgO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3ViU3FsICs9IGAoJHt0aGlzLmZvcm1hdHRlci5jb2x1bW5pemUoaW5zZXJ0RGF0YS5jb2x1bW5zKX0pIHZhbHVlcyAoJHtwYXJhbWV0ZXJpemVkVmFsdWVzfSlgO1xuICAgICAgfVxuICAgICAgc3ViU3FsICs9IChyZXR1cm5pbmcgPyBgIHJldHVybmluZyBST1dJRCBpbnRvICR7dGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKHJldHVybmluZ0hlbHBlcil9YCA6ICcnKTtcblxuICAgICAgLy8gcHJlIGJpbmQgcG9zaXRpb24gYmVjYXVzZSBzdWJTcWwgaXMgYW4gZXhlY3V0ZSBpbW1lZGlhdGUgcGFyYW1ldGVyXG4gICAgICAvLyBsYXRlciBwb3NpdGlvbiBiaW5kaW5nIHdpbGwgb25seSBjb252ZXJ0IHRoZSA/IHBhcmFtc1xuXG4gICAgICBzdWJTcWwgPSB0aGlzLmZvcm1hdHRlci5jbGllbnQucG9zaXRpb25CaW5kaW5ncyhzdWJTcWwpO1xuXG4gICAgICBjb25zdCBwYXJhbWV0ZXJpemVkVmFsdWVzV2l0aG91dERlZmF1bHQgPSBwYXJhbWV0ZXJpemVkVmFsdWVzLnJlcGxhY2UoJ0RFRkFVTFQsICcsICcnKS5yZXBsYWNlKCcsIERFRkFVTFQnLCAnJyk7XG4gICAgICByZXR1cm4gYGV4ZWN1dGUgaW1tZWRpYXRlICcke3N1YlNxbC5yZXBsYWNlKC8nL2csIFwiJydcIil9YCArXG4gICAgICAgICgocGFyYW1ldGVyaXplZFZhbHVlc1dpdGhvdXREZWZhdWx0IHx8IHJldHVybmluZykgPyAnXFwnIHVzaW5nICcgOiAnJykgK1xuICAgICAgICBwYXJhbWV0ZXJpemVkVmFsdWVzV2l0aG91dERlZmF1bHQgK1xuICAgICAgICAoKHBhcmFtZXRlcml6ZWRWYWx1ZXNXaXRob3V0RGVmYXVsdCAmJiByZXR1cm5pbmcpID8gJywgJyA6ICcnKSArXG4gICAgICAgIChyZXR1cm5pbmcgPyAnb3V0ID8nIDogJycpICsgJzsnO1xuICAgIH0pLmpvaW4oJyAnKSArICdlbmQ7JztcblxuICAgIGlmIChyZXR1cm5pbmcpIHtcbiAgICAgIHNxbC5yZXR1cm5pbmcgPSByZXR1cm5pbmc7XG4gICAgICAvLyBnZW5lcmF0ZSBzZWxlY3Qgc3RhdGVtZW50IHdpdGggc3BlY2lhbCBvcmRlciBieSB0byBrZWVwIHRoZSBvcmRlciBiZWNhdXNlICdpbiAoLi4pJyBtYXkgY2hhbmdlIHRoZSBvcmRlclxuICAgICAgc3FsLnJldHVybmluZ1NxbCA9IGBzZWxlY3QgJHt0aGlzLmZvcm1hdHRlci5jb2x1bW5pemUocmV0dXJuaW5nKX1gICtcbiAgICAgICAgJyBmcm9tICcgKyB0aGlzLnRhYmxlTmFtZSArXG4gICAgICAgICcgd2hlcmUgUk9XSUQgaW4gKCcgKyBzcWwub3V0UGFyYW1zLm1hcCgodiwgaSkgPT4gYDoke2kgKyAxfWApLmpvaW4oJywgJykgKyAnKScgK1xuICAgICAgICAnIG9yZGVyIGJ5IGNhc2UgUk9XSUQgJyArIHNxbC5vdXRQYXJhbXMubWFwKCh2LCBpKSA9PiBgd2hlbiBDSEFSVE9ST1dJRCg6JHtpICsgMX0pIHRoZW4gJHtpfWApLmpvaW4oJyAnKSArICcgZW5kJztcbiAgICB9XG5cbiAgICByZXR1cm4gc3FsO1xuICB9LFxuXG4gIC8vIFVwZGF0ZSBtZXRob2QsIGluY2x1ZGluZyBqb2lucywgd2hlcmVzLCBvcmRlciAmIGxpbWl0cy5cbiAgdXBkYXRlKCkge1xuICAgIGNvbnN0IHVwZGF0ZXMgPSB0aGlzLl9wcmVwVXBkYXRlKHRoaXMuc2luZ2xlLnVwZGF0ZSk7XG4gICAgY29uc3Qgd2hlcmUgPSB0aGlzLndoZXJlKCk7XG4gICAgbGV0IHsgcmV0dXJuaW5nIH0gPSB0aGlzLnNpbmdsZTtcbiAgICBjb25zdCBzcWwgPSBgdXBkYXRlICR7dGhpcy50YWJsZU5hbWV9YCArXG4gICAgICAnIHNldCAnICsgdXBkYXRlcy5qb2luKCcsICcpICtcbiAgICAgICh3aGVyZSA/IGAgJHt3aGVyZX1gIDogJycpO1xuXG4gICAgaWYgKCFyZXR1cm5pbmcpIHtcbiAgICAgIHJldHVybiBzcWw7XG4gICAgfVxuXG4gICAgLy8gYWx3YXlzIHdyYXAgcmV0dXJuaW5nIGFyZ3VtZW50IGluIGFycmF5XG4gICAgaWYgKHJldHVybmluZyAmJiAhQXJyYXkuaXNBcnJheShyZXR1cm5pbmcpKSB7XG4gICAgICByZXR1cm5pbmcgPSBbcmV0dXJuaW5nXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fYWRkUmV0dXJuaW5nVG9TcWxBbmRDb252ZXJ0KHNxbCwgcmV0dXJuaW5nLCB0aGlzLnRhYmxlTmFtZSk7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBgdHJ1bmNhdGVgIHF1ZXJ5LlxuICB0cnVuY2F0ZSgpIHtcbiAgICByZXR1cm4gYHRydW5jYXRlIHRhYmxlICR7dGhpcy50YWJsZU5hbWV9YDtcbiAgfSxcblxuICBmb3JVcGRhdGUoKSB7XG4gICAgcmV0dXJuICdmb3IgdXBkYXRlJztcbiAgfSxcblxuICBmb3JTaGFyZSgpIHtcbiAgICAvLyBsb2NrIGZvciBzaGFyZSBpcyBub3QgZGlyZWN0bHkgc3VwcG9ydGVkIGJ5IG9yYWNsZVxuICAgIC8vIHVzZSBMT0NLIFRBQkxFIC4uIElOIFNIQVJFIE1PREU7IGluc3RlYWRcbiAgICBoZWxwZXJzLndhcm4oJ2xvY2sgZm9yIHNoYXJlIGlzIG5vdCBzdXBwb3J0ZWQgYnkgb3JhY2xlIGRpYWxlY3QnKTtcbiAgICByZXR1cm4gJyc7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBgY29sdW1uSW5mb2AgcXVlcnkuXG4gIGNvbHVtbkluZm8oKSB7XG4gICAgY29uc3QgY29sdW1uID0gdGhpcy5zaW5nbGUuY29sdW1uSW5mbztcbiAgICByZXR1cm4ge1xuICAgICAgc3FsOiAnc2VsZWN0IENPTFVNTl9OQU1FLCBEQVRBX1RZUEUsIENIQVJfQ09MX0RFQ0xfTEVOR1RILCBOVUxMQUJMRSBmcm9tIFVTRVJfVEFCX0NPTFMgd2hlcmUgVEFCTEVfTkFNRSA9IDoxJyxcbiAgICAgIGJpbmRpbmdzOiBbdGhpcy5zaW5nbGUudGFibGVdLFxuICAgICAgb3V0cHV0KHJlc3ApIHtcbiAgICAgICAgY29uc3Qgb3V0ID0gcmVkdWNlKHJlc3AsIGZ1bmN0aW9uKGNvbHVtbnMsIHZhbCkge1xuICAgICAgICAgIGNvbHVtbnNbdmFsLkNPTFVNTl9OQU1FXSA9IHtcbiAgICAgICAgICAgIHR5cGU6IHZhbC5EQVRBX1RZUEUsXG4gICAgICAgICAgICBtYXhMZW5ndGg6IHZhbC5DSEFSX0NPTF9ERUNMX0xFTkdUSCxcbiAgICAgICAgICAgIG51bGxhYmxlOiAodmFsLk5VTExBQkxFID09PSAnWScpXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICAgICAgfSwge30pO1xuICAgICAgICByZXR1cm4gY29sdW1uICYmIG91dFtjb2x1bW5dIHx8IG91dDtcbiAgICAgIH1cbiAgICB9O1xuICB9LFxuXG4gIHNlbGVjdCgpIHtcbiAgICBjb25zdCBzdGF0ZW1lbnRzID0gbWFwKGNvbXBvbmVudHMsIChjb21wb25lbnQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzW2NvbXBvbmVudF0oKTtcbiAgICB9KTtcbiAgICBjb25zdCBxdWVyeSA9IGNvbXBhY3Qoc3RhdGVtZW50cykuam9pbignICcpO1xuICAgIHJldHVybiB0aGlzLl9zdXJyb3VuZFF1ZXJ5V2l0aExpbWl0QW5kT2Zmc2V0KHF1ZXJ5KTtcbiAgfSxcblxuICBhZ2dyZWdhdGUoc3RtdCkge1xuICAgIGNvbnN0IHZhbCA9IHN0bXQudmFsdWU7XG4gICAgY29uc3Qgc3BsaXRPbiA9IHZhbC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJyBhcyAnKTtcbiAgICBjb25zdCBkaXN0aW5jdCA9IHN0bXQuYWdncmVnYXRlRGlzdGluY3QgPyAnZGlzdGluY3QgJyA6ICcnO1xuICAgIC8vIEFsbG93cyB1cyB0byBzcGVjaXkgYW4gYWxpYXMgZm9yIHRoZSBhZ2dyZWdhdGUgdHlwZXMuXG4gICAgaWYgKHNwbGl0T24gIT09IC0xKSB7XG4gICAgICBjb25zdCBjb2wgPSB2YWwuc2xpY2UoMCwgc3BsaXRPbik7XG4gICAgICBjb25zdCBhbGlhcyA9IHZhbC5zbGljZShzcGxpdE9uICsgNCk7XG4gICAgICByZXR1cm4gc3RtdC5tZXRob2QgKyAnKCcgKyBkaXN0aW5jdCArIHRoaXMuZm9ybWF0dGVyLndyYXAoY29sKSArICcpICcgKyB0aGlzLmZvcm1hdHRlci53cmFwKGFsaWFzKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0bXQubWV0aG9kICsgJygnICsgZGlzdGluY3QgKyB0aGlzLmZvcm1hdHRlci53cmFwKHZhbCkgKyAnKSc7XG4gIH0sXG5cbiAgLy8gZm9yIHNpbmdsZSBjb21tYW5kcyBvbmx5XG4gIF9hZGRSZXR1cm5pbmdUb1NxbEFuZENvbnZlcnQoc3FsLCByZXR1cm5pbmcsIHRhYmxlTmFtZSkge1xuICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgIHNxbFxuICAgIH07XG5cbiAgICBpZiAoIXJldHVybmluZykge1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBjb25zdCByZXR1cm5pbmdWYWx1ZXMgPSBBcnJheS5pc0FycmF5KHJldHVybmluZykgPyByZXR1cm5pbmcgOiBbcmV0dXJuaW5nXTtcbiAgICBjb25zdCByZXR1cm5pbmdIZWxwZXIgPSBuZXcgUmV0dXJuaW5nSGVscGVyKHJldHVybmluZ1ZhbHVlcy5qb2luKCc6JykpO1xuICAgIHJlcy5zcWwgPSBzcWwgKyAnIHJldHVybmluZyBST1dJRCBpbnRvICcgKyB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIocmV0dXJuaW5nSGVscGVyKTtcbiAgICByZXMucmV0dXJuaW5nU3FsID0gYHNlbGVjdCAke3RoaXMuZm9ybWF0dGVyLmNvbHVtbml6ZShyZXR1cm5pbmcpfSBmcm9tICR7dGFibGVOYW1lfSB3aGVyZSBST1dJRCA9IDoxYDtcbiAgICByZXMub3V0UGFyYW1zID0gW3JldHVybmluZ0hlbHBlcl07XG4gICAgcmVzLnJldHVybmluZyA9IHJldHVybmluZztcbiAgICByZXR1cm4gcmVzO1xuICB9LFxuXG4gIF9zdXJyb3VuZFF1ZXJ5V2l0aExpbWl0QW5kT2Zmc2V0KHF1ZXJ5KSB7XG4gICAgbGV0IHsgbGltaXQgfSA9IHRoaXMuc2luZ2xlXG4gICAgY29uc3QgeyBvZmZzZXQgfSA9IHRoaXMuc2luZ2xlXG4gICAgY29uc3QgaGFzTGltaXQgPSAobGltaXQgfHwgbGltaXQgPT09IDAgfHwgbGltaXQgPT09ICcwJyk7XG4gICAgbGltaXQgPSArbGltaXQ7XG5cbiAgICBpZiAoIWhhc0xpbWl0ICYmICFvZmZzZXQpIHJldHVybiBxdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5IHx8IFwiXCI7XG5cbiAgICBpZiAoaGFzTGltaXQgJiYgIW9mZnNldCkge1xuICAgICAgcmV0dXJuIGBzZWxlY3QgKiBmcm9tICgke3F1ZXJ5fSkgd2hlcmUgcm93bnVtIDw9ICR7dGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKGxpbWl0KX1gO1xuICAgIH1cblxuICAgIGNvbnN0IGVuZFJvdyA9ICsob2Zmc2V0KSArIChoYXNMaW1pdCA/IGxpbWl0IDogMTAwMDAwMDAwMDAwMDApO1xuXG4gICAgcmV0dXJuIFwic2VsZWN0ICogZnJvbSBcIiArXG4gICAgICAgICAgIFwiKHNlbGVjdCByb3dfLiosIFJPV05VTSByb3dudW1fIGZyb20gKFwiICsgcXVlcnkgKyBcIikgcm93XyBcIiArXG4gICAgICAgICAgIFwid2hlcmUgcm93bnVtIDw9IFwiICsgdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKGVuZFJvdykgKyBcIikgXCIgK1xuICAgICAgICAgICBcIndoZXJlIHJvd251bV8gPiBcIiArIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcihvZmZzZXQpO1xuICB9XG5cbn0pXG5cbi8vIENvbXBpbGVzIHRoZSBgc2VsZWN0YCBzdGF0ZW1lbnQsIG9yIG5lc3RlZCBzdWItc2VsZWN0c1xuLy8gYnkgY2FsbGluZyBlYWNoIG9mIHRoZSBjb21wb25lbnQgY29tcGlsZXJzLCB0cmltbWluZyBvdXRcbi8vIHRoZSBlbXB0aWVzLCBhbmQgcmV0dXJuaW5nIGEgZ2VuZXJhdGVkIHF1ZXJ5IHN0cmluZy5cblF1ZXJ5Q29tcGlsZXJfT3JhY2xlLnByb3RvdHlwZS5maXJzdCA9IFF1ZXJ5Q29tcGlsZXJfT3JhY2xlLnByb3RvdHlwZS5zZWxlY3RcblxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9PcmFjbGU7XG4iXX0=