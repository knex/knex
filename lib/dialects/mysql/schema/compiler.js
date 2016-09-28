'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// MySQL Schema Compiler
// -------
function SchemaCompiler_MySQL(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(SchemaCompiler_MySQL, _compiler2.default);

(0, _assign3.default)(SchemaCompiler_MySQL.prototype, {

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
  },


  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    this.pushQuery({
      sql: 'show tables like ' + this.formatter.parameter(tableName),
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