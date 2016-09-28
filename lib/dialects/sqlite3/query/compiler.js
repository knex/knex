'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _noop2 = require('lodash/noop');

var _noop3 = _interopRequireDefault(_noop2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// SQLite3 Query Builder & Compiler

function QueryCompiler_SQLite3(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_SQLite3, _compiler2.default);

(0, _assign3.default)(QueryCompiler_SQLite3.prototype, {

  // The locks are not applicable in SQLite3
  forShare: emptyStr,

  forUpdate: emptyStr,

  // SQLite requires us to build the multi-row insert as a listing of select with
  // unions joining them together. So we'll build out this list of columns and
  // then join them all together with select unions to complete the queries.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var sql = this.with() + ('insert into ' + this.tableName + ' ');

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      } else if (insertValues.length === 1 && insertValues[0] && (0, _isEmpty3.default)(insertValues[0])) {
        return sql + this._emptyInsertValue;
      }
    } else if ((typeof insertValues === 'undefined' ? 'undefined' : (0, _typeof3.default)(insertValues)) === 'object' && (0, _isEmpty3.default)(insertValues)) {
      return sql + this._emptyInsertValue;
    }

    var insertData = this._prepInsert(insertValues);

    if ((0, _isString3.default)(insertData)) {
      return sql + insertData;
    }

    if (insertData.columns.length === 0) {
      return '';
    }

    sql += '(' + this.formatter.columnize(insertData.columns) + ')';

    // backwards compatible error
    if (this.client.valueForUndefined !== null) {
      (0, _each3.default)(insertData.values, function (bindings) {
        (0, _each3.default)(bindings, function (binding) {
          if (binding === undefined) throw new TypeError('`sqlite` does not support inserting default values. Specify ' + 'values explicitly or use the `useNullAsDefault` config flag. ' + '(see docs http://knexjs.org/#Builder-insert).');
        });
      });
    }

    if (insertData.values.length === 1) {
      var parameters = this.formatter.parameterize(insertData.values[0], this.client.valueForUndefined);
      return sql + (' values (' + parameters + ')');
    }

    var blocks = [];
    var i = -1;
    while (++i < insertData.values.length) {
      var i2 = -1;
      var block = blocks[i] = [];
      var current = insertData.values[i];
      current = current === undefined ? this.client.valueForUndefined : current;
      while (++i2 < insertData.columns.length) {
        block.push(this.formatter.alias(this.formatter.parameter(current[i2]), this.formatter.wrap(insertData.columns[i2])));
      }
      blocks[i] = block.join(', ');
    }
    return sql + ' select ' + blocks.join(' union all select ');
  },


  // Compile a truncate table statement into SQL.
  truncate: function truncate() {
    var table = this.tableName;
    return {
      sql: 'delete from ' + table,
      output: function output() {
        return this.query({
          sql: 'delete from sqlite_sequence where name = ' + table
        }).catch(_noop3.default);
      }
    };
  },


  // Compiles a `columnInfo` query
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;
    return {
      sql: 'PRAGMA table_info(' + this.single.table + ')',
      output: function output(resp) {
        var maxLengthRegex = /.*\((\d+)\)/;
        var out = (0, _reduce3.default)(resp, function (columns, val) {
          var type = val.type;

          var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1];
          type = maxLength ? type.split('(')[0] : type;
          columns[val.name] = {
            type: type.toLowerCase(),
            maxLength: maxLength,
            nullable: !val.notnull,
            defaultValue: val.dflt_value
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  },
  limit: function limit() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only,
    // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
    return 'limit ' + this.formatter.parameter(noLimit ? -1 : this.single.limit);
  }
});

function emptyStr() {
  return '';
}

exports.default = QueryCompiler_SQLite3;
module.exports = exports['default'];