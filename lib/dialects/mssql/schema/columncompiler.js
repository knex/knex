
// MySQL Column Compiler
// -------
'use strict';

var inherits = require('inherits');
var ColumnCompiler = require('../../../schema/columncompiler');
var helpers = require('../../../helpers');
var assign = require('lodash/object/assign');

function ColumnCompiler_MSSQL() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'first', 'after', 'comment'];
}
inherits(ColumnCompiler_MSSQL, ColumnCompiler);

// Types
// ------

assign(ColumnCompiler_MSSQL.prototype, {

  increments: 'int identity(1,1) not null primary key',

  bigincrements: 'bigint identity(1,1) not null primary key',

  bigint: 'bigint',

  double: function double(precision, scale) {
    if (!precision) return 'double';
    return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
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
    return length ? 'bit(' + this._num(length) + ')' : 'bit';
  },

  binary: function binary(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'blob';
  },

  bool: 'bit',

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    /*jshint unused: false*/
    var defaultVal = ColumnCompiler_MSSQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  first: function first() {
    return 'first';
  },

  after: function after(column) {
    return 'after ' + this.formatter.wrap(column);
  },

  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for MSSQL');
    }
    return '';
  }

});

module.exports = ColumnCompiler_MSSQL;