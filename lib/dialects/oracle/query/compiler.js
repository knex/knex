'use strict';

exports.__esModule = true;

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _utils = require('../utils');

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

(0, _lodash.assign)(QueryCompiler_Oracle.prototype, {

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var _this = this;

    var insertValues = this.single.insert || [];
    var returning = this.single.returning;


    if (!Array.isArray(insertValues) && (0, _lodash.isPlainObject)(this.single.insert)) {
      insertValues = [this.single.insert];
    }

    // always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    if (Array.isArray(insertValues) && insertValues.length === 1 && (0, _lodash.isEmpty)(insertValues[0])) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
    }

    if ((0, _lodash.isEmpty)(this.single.insert) && typeof this.single.insert !== 'function') {
      return '';
    }

    var insertData = this._prepInsert(insertValues);

    var sql = {};

    if ((0, _lodash.isString)(insertData)) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
    }

    if (insertData.values.length === 1) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
    }

    var insertDefaultsOnly = insertData.columns.length === 0;

    sql.sql = 'begin ' + (0, _lodash.map)(insertData.values, function (value) {
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
    this.client.logger.warn('lock for share is not supported by oracle dialect');
    return '';
  },


  // Compiles a `columnInfo` query.
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    var table = this.client.customWrapIdentifier(this.single.table, _lodash.identity);

    // Node oracle drivers doesn't support LONG type (which is data_default type)
    var sql = 'select * from xmltable( \'/ROWSET/ROW\'\n      passing dbms_xmlgen.getXMLType(\'\n      select char_col_decl_length, column_name, data_type, data_default, nullable\n      from user_tab_columns where table_name = \'\'' + table + '\'\' \')\n      columns\n      CHAR_COL_DECL_LENGTH number, COLUMN_NAME varchar2(200), DATA_TYPE varchar2(106),\n      DATA_DEFAULT clob, NULLABLE varchar2(1))';

    return {
      sql: sql,
      output: function output(resp) {
        var out = (0, _lodash.reduce)(resp, function (columns, val) {
          columns[val.COLUMN_NAME] = {
            type: val.DATA_TYPE,
            defaultValue: val.DATA_DEFAULT,
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
    var statements = (0, _lodash.map)(components, function (component) {
      return _this2[component]();
    });
    query += (0, _lodash.compact)(statements).join(' ');
    return this._surroundQueryWithLimitAndOffset(query);
  },
  aggregate: function aggregate(stmt) {
    return this._aggregate(stmt, { aliasSeparator: ' ' });
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