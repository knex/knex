'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../postgres/schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Redshift Column Compiler
// -------

function ColumnCompiler_Redshift() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
}
(0, _inherits2.default)(ColumnCompiler_Redshift, _columncompiler2.default);

(0, _assign3.default)(ColumnCompiler_Redshift.prototype, {
  bigincrements: 'bigint identity(1,1) primary key not null',
  binary: 'varchar(max)',
  bit: function bit(column) {
    return column.length !== false ? 'char(' + column.length + ')' : 'char(1)';
  },

  blob: 'varchar(max)',
  datetime: 'timestamp',
  enu: 'text',
  enum: 'text',
  increments: 'integer identity(1,1) primary key not null',
  json: 'varchar(max)',
  jsonb: 'varchar(max)',
  longblob: 'varchar(max)',
  mediumblob: 'varchar(max)',
  set: 'text',
  text: 'varchar(max)',
  timestamp: 'timestamp',
  tinyblob: 'text',
  uuid: 'char(32)',
  varbinary: 'varchar(max)'
});

exports.default = ColumnCompiler_Redshift;
module.exports = exports['default'];