'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// MSSQL Query Compiler
// ------
function QueryCompiler_MSSQL(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_MSSQL, _compiler2.default);

(0, _assign3.default)(QueryCompiler_MSSQL.prototype, {

  _emptyInsertValue: 'default values',

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var sql = this.with() + ('insert into ' + this.tableName + ' ');
    var returning = this.single.returning;

    var returningSql = returning ? this._returning('insert', returning) + ' ' : '';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if ((typeof insertValues === 'undefined' ? 'undefined' : (0, _typeof3.default)(insertValues)) === 'object' && (0, _isEmpty3.default)(insertValues)) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning: returning
      };
    }

    var insertData = this._prepInsert(insertValues);
    if (typeof insertData === 'string') {
      sql += insertData;
    } else {
      if (insertData.columns.length) {
        sql += '(' + this.formatter.columnize(insertData.columns);
        sql += ') ' + returningSql + 'values (';
        var i = -1;
        while (++i < insertData.values.length) {
          if (i !== 0) sql += '), (';
          sql += this.formatter.parameterize(insertData.values[i], this.client.valueForUndefined);
        }
        sql += ')';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue;
      } else {
        sql = '';
      }
    }
    return {
      sql: sql,
      returning: returning
    };
  },


  // Compiles an `update` query, allowing for a return value.
  update: function update() {
    var updates = this._prepUpdate(this.single.update);
    var join = this.join();
    var where = this.where();
    var order = this.order();
    var top = this.top();
    var returning = this.single.returning;

    return {
      sql: this.with() + ('update ' + (top ? top + ' ' : '') + this.tableName) + (join ? ' ' + join : '') + ' set ' + updates.join(', ') + (returning ? ' ' + this._returning('update', returning) : '') + (where ? ' ' + where : '') + (order ? ' ' + order : '') + (!returning ? this._returning('rowcount', '@@rowcount') : ''),
      returning: returning || '@@rowcount'
    };
  },


  // Compiles a `delete` query.
  del: function del() {
    // Make sure tableName is processed by the formatter first.
    var tableName = this.tableName;

    var wheres = this.where();
    var returning = this.single.returning;

    return {
      sql: this.with() + ('delete from ' + tableName) + (returning ? ' ' + this._returning('del', returning) : '') + (wheres ? ' ' + wheres : '') + (!returning ? this._returning('rowcount', '@@rowcount') : ''),
      returning: returning || '@@rowcount'
    };
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
        } else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value));
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    var top = this.top();
    return 'select ' + (distinct ? 'distinct ' : '') + (top ? top + ' ' : '') + sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
  },
  _returning: function _returning(method, value) {
    switch (method) {
      case 'update':
      case 'insert':
        return value ? 'output ' + this.formatter.columnizeWithPrefix('inserted.', value) : '';
      case 'del':
        return value ? 'output ' + this.formatter.columnizeWithPrefix('deleted.', value) : '';
      case 'rowcount':
        return value ? ';select @@rowcount' : '';
    }
  },


  // Compiles a `truncate` query.
  truncate: function truncate() {
    return 'truncate table ' + this.tableName;
  },
  forUpdate: function forUpdate() {
    return 'with (READCOMMITTEDLOCK)';
  },
  forShare: function forShare() {
    return 'with (NOLOCK)';
  },


  // Compiles a `columnInfo` query.
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;
    var sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    var bindings = [this.single.table, this.client.database()];

    if (this.single.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.single.schema);
    } else {
      sql += ' and table_schema = \'dbo\'';
    }

    return {
      sql: sql,
      bindings: bindings,
      output: function output(resp) {
        var out = resp.reduce(function (columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE,
            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
            nullable: val.IS_NULLABLE === 'YES'
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  },
  top: function top() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    var noOffset = !this.single.offset;
    if (noLimit || !noOffset) return '';
    return 'top (' + this.formatter.parameter(this.single.limit) + ')';
  },
  limit: function limit() {
    return '';
  },
  offset: function offset() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    var noOffset = !this.single.offset;
    if (noOffset) return '';
    var offset = 'offset ' + (noOffset ? '0' : this.formatter.parameter(this.single.offset)) + ' rows';
    if (!noLimit) {
      offset += ' fetch next ' + this.formatter.parameter(this.single.limit) + ' rows only';
    }
    return offset;
  }
});

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
exports.default = QueryCompiler_MSSQL;
module.exports = exports['default'];