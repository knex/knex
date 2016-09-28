'use strict';

exports.__esModule = true;

var _some2 = require('lodash/some');

var _some3 = _interopRequireDefault(_some2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Schema Compiler
// -------

// SQLite3: Column Builder & Compiler
// -------
function SchemaCompiler_SQLite3() {
  _compiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(SchemaCompiler_SQLite3, _compiler2.default);

// Compile the query to determine if a table exists.
SchemaCompiler_SQLite3.prototype.hasTable = function (tableName) {
  var sql = 'select * from sqlite_master ' + ('where type = \'table\' and name = ' + this.formatter.parameter(tableName));
  this.pushQuery({ sql: sql, output: function output(resp) {
      return resp.length > 0;
    } });
};

// Compile the query to determine if a column exists.
SchemaCompiler_SQLite3.prototype.hasColumn = function (tableName, column) {
  this.pushQuery({
    sql: 'PRAGMA table_info(' + this.formatter.wrap(tableName) + ')',
    output: function output(resp) {
      return (0, _some3.default)(resp, { name: column });
    }
  });
};

// Compile a rename table command.
SchemaCompiler_SQLite3.prototype.renameTable = function (from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

exports.default = SchemaCompiler_SQLite3;
module.exports = exports['default'];