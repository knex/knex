'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SchemaCompiler_MySQL(client, builder) {
  _compiler2.default.call(this, client, builder);
}
// MySQL Schema Compiler
// -------

(0, _inherits2.default)(SchemaCompiler_MySQL, _compiler2.default);

(0, _lodash.assign)(SchemaCompiler_MySQL.prototype, {

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
  },


  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    var sql = 'select * from information_schema.tables where table_name = ?';
    var bindings = [tableName];

    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    } else {
      sql += ' and table_schema = database()';
    }

    this.pushQuery({
      sql: sql,
      bindings: bindings,
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  },


  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: 'show columns from ' + this.formatter.wrap(tableName) + ' like ' + this.formatter.parameter(column),
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  }
});

exports.default = SchemaCompiler_MySQL;
module.exports = exports['default'];