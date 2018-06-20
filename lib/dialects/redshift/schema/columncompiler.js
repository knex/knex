'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../postgres/schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ColumnCompiler_Redshift() {
  _columncompiler2.default.apply(this, arguments);
}
// Redshift Column Compiler
// -------

(0, _inherits2.default)(ColumnCompiler_Redshift, _columncompiler2.default);

(0, _lodash.assign)(ColumnCompiler_Redshift.prototype, {
  // Types:
  // ------
  bigincrements: 'bigint identity(1,1) primary key not null',
  binary: 'varchar(max)',
  bit: function bit(column) {
    return column.length !== false ? 'char(' + column.length + ')' : 'char(1)';
  },

  blob: 'varchar(max)',
  enu: 'varchar(255)',
  enum: 'varchar(255)',
  increments: 'integer identity(1,1) primary key not null',
  json: 'varchar(max)',
  jsonb: 'varchar(max)',
  longblob: 'varchar(max)',
  mediumblob: 'varchar(16777218)',
  set: 'text',
  text: 'varchar(max)',
  datetime: function datetime(without) {
    return without ? 'timestamp' : 'timestamptz';
  },
  timestamp: function timestamp(without) {
    return without ? 'timestamp' : 'timestamptz';
  },

  tinyblob: 'varchar(256)',
  uuid: 'char(36)',
  varbinary: 'varchar(max)',
  bigint: 'bigint',
  bool: 'boolean',
  double: 'double precision',
  floating: 'real',
  smallint: 'smallint',
  tinyint: 'smallint',

  // Modifiers:
  // ------
  comment: function comment(_comment) {
    this.pushAdditional(function () {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is " + (_comment ? '\'' + _comment + '\'' : 'NULL'));
    }, _comment);
  }
});

exports.default = ColumnCompiler_Redshift;
module.exports = exports['default'];