'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Column Compiler
// -------

function ColumnCompiler_SQLite3() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo'];
}
(0, _inherits2.default)(ColumnCompiler_SQLite3, _columncompiler2.default);

// Types
// -------

ColumnCompiler_SQLite3.prototype.double = ColumnCompiler_SQLite3.prototype.decimal = ColumnCompiler_SQLite3.prototype.floating = 'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

exports.default = ColumnCompiler_SQLite3;
module.exports = exports['default'];