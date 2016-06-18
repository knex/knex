
// MySQL Column Compiler
// -------
'use strict';

var inherits = require('inherits');
var ColumnCompiler = require('../../../schema/columncompiler');
var helpers = require('../../../helpers');
var assign = require('lodash/object/assign');

function ColumnCompiler_MySQL() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment'];
}
inherits(ColumnCompiler_MySQL, ColumnCompiler);

// Types
// ------

assign(ColumnCompiler_MySQL.prototype, {

  increments: 'int unsigned not null auto_increment primary key',

  bigincrements: 'bigint unsigned not null auto_increment primary key',

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

  enu: function enu(allowed) {
    return "enum('" + allowed.join("', '") + "')";
  },

  datetime: 'datetime',

  timestamp: 'timestamp',

  bit: function bit(length) {
    return length ? 'bit(' + this._num(length) + ')' : 'bit';
  },

  binary: function binary(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'blob';
  },

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    /*jshint unused: false*/
    var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  unsigned: function unsigned() {
    return 'unsigned';
  },

  first: function first() {
    return 'first';
  },

  after: function after(column) {
    return 'after ' + this.formatter.wrap(column);
  },

  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for MySQL');
    }
    return _comment && "comment '" + _comment + "'";
  }

});

module.exports = ColumnCompiler_MySQL;