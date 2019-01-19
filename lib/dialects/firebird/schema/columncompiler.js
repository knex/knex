'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _trigger = require('./trigger');

var _trigger2 = _interopRequireDefault(_trigger);

var _lodash = require('lodash');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Firebird Column Compiler
// -------
function ColumnCompiler_Firebird() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = [
    'unsigned',
    'nullable',
    'defaultTo',
    'first',
    'after',
    'comment',
  ];
}
(0, _inherits2.default)(ColumnCompiler_Firebird, _columncompiler2.default);

// Types
// ------

(0, _lodash.assign)(ColumnCompiler_Firebird.prototype, {
  _createAutoIncrementTriggerAndSequence: function _createAutoIncrementTriggerAndSequence() {
    // TODO Add warning that sequence etc is created
    this.pushAdditional(function() {
      var tableName = this.tableCompiler.tableNameRaw;
      var createAutoIncrementSQL = _trigger2.default.createAutoIncrementSequence(
        this.client.logger,
        tableName
      );
      this.pushQuery(createAutoIncrementSQL);

      var autoIncrementColumnName = (0, _lodash.first)(this.args);
      var createTriggerSQL = _trigger2.default.createAutoIncrementTrigger(
        this.client.logger,
        tableName,
        autoIncrementColumnName
      );
      this.pushQuery(createTriggerSQL);
    });
  },
  increments: function increments() {
    this._createAutoIncrementTriggerAndSequence();
    return 'integer not null primary key';
  },
  bigincrements: function bigincrements() {
    this._createAutoIncrementTriggerAndSequence();
    return 'bigint not null primary key';
  },

  bigint: 'bigint',

  double: function double(precision, scale) {
    if (!precision) return 'double';
    return (
      'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')'
    );
  },

  integer: function integer(length) {
    length = length ? '(' + this._num(length, 11) + ')' : '';
    return 'int' + length;
  },

  mediumint: 'mediumint',

  smallint: 'smallint',

  tinyint: function tinyint(length) {
    length = length ? '(' + this._num(length, 1) + ')' : '';
    return 'tinyint' + length;
  },
  text: function text(column) {
    switch (column) {
      case 'medium':
      case 'mediumtext':
        return 'mediumtext';
      case 'long':
      case 'longtext':
        return 'longtext';
      default:
        return 'text';
    }
  },
  mediumtext: function mediumtext() {
    return this.text('medium');
  },
  longtext: function longtext() {
    return this.text('long');
  },

  enu: 'varchar(100)',

  datetime: 'datetime',

  timestamp: 'timestamp',

  time: 'time',

  bit: 'char(1)',

  binary: function binary(length) {
    return length ? 'char(' + this._num(length) + ')' : 'blob sub_type text';
  },

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    var defaultVal = ColumnCompiler_Firebird.super_.prototype.defaultTo.apply(
      this,
      arguments
    );
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },
  unsigned: function unsigned() {
    return '';
  },
  first: function first() {
    this.client.logger.warn('Column first modifier not available for Firebird');
    return '';
  },
  after: function after(column) {
    this.client.logger.warn('Column after modifier not available for Firebird');
    return '';
  },
  comment: function comment(_comment) {
    this.client.logger.warn(
      'Column comment modifier not available for Firebird'
    );
    return '';
  },
  varchar: function varchar(length) {
    return 'varchar(' + this._num(length, 255) + ')  CHARACTER SET UTF8';
  },
});

exports.default = ColumnCompiler_Firebird;
module.exports = exports['default'];
