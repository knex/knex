
// Firebird Column Compiler
// -------
var inherits       = require('inherits')
var ColumnCompiler = require('../../../schema/columncompiler')
var helpers        = require('../../../helpers')
var assign         = require('lodash/object/assign');

function ColumnCompiler_Firebird() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment']
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

// Types
// ------

assign(ColumnCompiler_Firebird.prototype, {

  increments: 'int not null primary key',

  //bigincrements: 'bigint unsigned not null auto_increment primary key',

  bigint: 'bigint',

  double: function(precision, scale) {
    if (!precision) return 'double'
    return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')'
  },

  integer: function(length) {
    length = length ? '(' + this._num(length, 11) + ')' : ''
    return 'int' + length
  },

  mediumint: 'mediumint',

  smallint: 'smallint',

  tinyint: function(length) {
    length = length ? '(' + this._num(length, 1) + ')' : ''
    return 'tinyint' + length
  },

  text: function(column) {
    switch (column) {
      case 'medium':
      case 'mediumtext':
        return 'mediumtext';
      case 'long':
      case 'longtext':
        return 'longtext'
      default:
        return 'text';
    }
  },

  mediumtext: function() {
    return this.text('medium')
  },

  longtext: function() {
    return this.text('long')
  },

  enu: function(allowed) {
    return "enum('" + allowed.join("', '")  + "')"
  },

  datetime: 'datetime',

  timestamp: 'timestamp',

  bit: function(length) {
    return length ? 'bit(' + this._num(length) + ')' : 'bit'
  },

  binary: function(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'blob'
  },

  // Modifiers
  // ------

  defaultTo: function(value) {
    /*jshint unused: false*/
    var defaultVal = ColumnCompiler_Firebird.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal
    }
    return ''
  },
  
  unsigned: function() {
    return ''
  },
  
  first: function() {
    return 'first'
  },
  
  after: function(column) {
    return 'after ' + this.formatter.wrap(column)
  },
  
  comment: function(comment) {
    if (comment && comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for Firebird')
    }
    return comment && "comment '" + comment + "'"
  },
  
  varchar: function(length) {
    return 'varchar(' + this._num(length, 255) + ')  CHARACTER SET UTF8';
  },

})

module.exports = ColumnCompiler_Firebird;
