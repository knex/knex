'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SchemaCompiler_MSSQL(client, builder) {
  _compiler2.default.call(this, client, builder);
}
// MySQL Schema Compiler
// -------

(0, _inherits2.default)(SchemaCompiler_MSSQL, _compiler2.default);

(0, _lodash.assign)(SchemaCompiler_MSSQL.prototype, {

  dropTablePrefix: 'DROP TABLE ',
  dropTableIfExists: function dropTableIfExists(tableName) {
    var name = this.formatter.wrap(prefixedTableName(this.schema, tableName));
    this.pushQuery('if object_id(\'' + name + '\', \'U\') is not null DROP TABLE ' + name);
  },


  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('exec sp_rename ' + this.formatter.parameter(tableName) + ', ' + this.formatter.parameter(to));
  },


  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    var formattedTable = this.formatter.parameter(this.formatter.wrap(tableName));
    var sql = 'select object_id from sys.tables ' + ('where object_id = object_id(' + formattedTable + ')');
    this.pushQuery({ sql: sql, output: function output(resp) {
        return resp.length > 0;
      } });
  },


  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    var formattedColumn = this.formatter.parameter(column);
    var formattedTable = this.formatter.parameter(this.formatter.wrap(tableName));
    var sql = 'select object_id from sys.columns ' + ('where name = ' + formattedColumn + ' ') + ('and object_id = object_id(' + formattedTable + ')');
    this.pushQuery({ sql: sql, output: function output(resp) {
        return resp.length > 0;
      } });
  }
});

function prefixedTableName(prefix, table) {
  return prefix ? prefix + '.' + table : table;
}

exports.default = SchemaCompiler_MSSQL;
module.exports = exports['default'];