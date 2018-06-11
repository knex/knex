'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ColumnCompiler_MSSQL() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'first', 'after', 'comment'];
}
// MySQL Column Compiler
// -------

(0, _inherits2.default)(ColumnCompiler_MSSQL, _columncompiler2.default);

// Types
// ------

(0, _lodash.assign)(ColumnCompiler_MSSQL.prototype, {

  increments: 'int identity(1,1) not null primary key',

  bigincrements: 'bigint identity(1,1) not null primary key',

  bigint: 'bigint',

  double(precision, scale) {
    if (!precision) return 'decimal';
    return `decimal(${this._num(precision, 8)}, ${this._num(scale, 2)})`;
  },

  floating(precision, scale) {
    if (!precision) return 'decimal';
    return `decimal(${this._num(precision, 8)}, ${this._num(scale, 2)})`;
  },

  integer(length) {
    length = length ? `(${this._num(length, 11)})` : '';
    return `int${length}`;
  },

  mediumint: 'int',

  smallint: 'smallint',

  tinyint(length) {
    length = length ? `(${this._num(length, 1)})` : '';
    return `tinyint${length}`;
  },

  varchar(length) {
    return `nvarchar(${this._num(length, 255)})`;
  },

  text: 'nvarchar(max)',

  mediumtext: 'nvarchar(max)',

  longtext: 'nvarchar(max)',

  // TODO: mssql supports check constraints as of SQL Server 2008
  // so make enu here more like postgres
  enu: 'nvarchar(100)',

  uuid: 'uniqueidentifier',

  datetime: 'datetime',

  timestamp: 'datetime',

  bit(length) {
    if (length > 1) {
      this.client.logger.warn('Bit field is exactly 1 bit length for MSSQL');
    }
    return 'bit';
  },

  binary(length) {
    return length ? `varbinary(${this._num(length)})` : 'varbinary(max)';
  },

  bool: 'bit',

  // Modifiers
  // ------

  defaultTo(value) {
    const defaultVal = ColumnCompiler_MSSQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  first() {
    this.client.logger.warn('Column first modifier not available for MSSQL');
    return '';
  },

  after(column) {
    this.client.logger.warn('Column after modifier not available for MSSQL');
    return '';
  },

  comment(comment) {
    if (comment && comment.length > 255) {
      this.client.logger.warn('Your comment is longer than the max comment length for MSSQL');
    }
    return '';
  }

});

exports.default = ColumnCompiler_MSSQL;
module.exports = exports['default'];