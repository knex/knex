'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

(0, _assign3.default)(ColumnCompiler_MSSQL.prototype, {

  increments: 'int identity(1,1) not null primary key',

  bigincrements: 'bigint identity(1,1) not null primary key',

  bigint: 'bigint',

  double: function double(precision, scale) {
    if (!precision) return 'decimal';
    return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },
  floating: function floating(precision, scale) {
    if (!precision) return 'decimal';
    return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },
  integer: function integer(length) {
    length = length ? '(' + this._num(length, 11) + ')' : '';
    return 'int' + length;
  },


  mediumint: 'int',

  smallint: 'smallint',

  tinyint: function tinyint(length) {
    length = length ? '(' + this._num(length, 1) + ')' : '';
    return 'tinyint' + length;
  },
  varchar: function varchar(length) {
    return 'nvarchar(' + this._num(length, 255) + ')';
  },


  text: 'nvarchar(max)',

  mediumtext: 'nvarchar(max)',

  longtext: 'nvarchar(max)',

  enu: 'nvarchar(100)',

  uuid: 'uniqueidentifier',

  datetime: 'datetime',

  timestamp: 'datetime',

  bit: function bit(length) {
    if (length > 1) {
      helpers.warn('Bit field is exactly 1 bit length for MSSQL');
    }
    return 'bit';
  },
  binary: function binary(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'varbinary(max)';
  },


  bool: 'bit',

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    var defaultVal = ColumnCompiler_MSSQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },
  first: function first() {
    helpers.warn('Column first modifier not available for MSSQL');
    return '';
  },
  after: function after(column) {
    helpers.warn('Column after modifier not available for MSSQL');
    return '';
  },
  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for MSSQL');
    }
    return '';
  }
});

exports.default = ColumnCompiler_MSSQL;
module.exports = exports['default'];