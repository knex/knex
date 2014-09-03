'use strict';

// MySQL Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');
var helpers  = require('../../../helpers');

// Column Builder
// -------

function ColumnBuilder_MySQL() {
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_MySQL, Schema.ColumnBuilder);

// Column Compiler
// -------

function ColumnCompiler_MySQL() {
  this.Formatter = client.Formatter;
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment'];
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_MySQL, Schema.ColumnCompiler);

// Types
// ------

ColumnCompiler_MySQL.prototype.increments = 'int unsigned not null auto_increment primary key';
ColumnCompiler_MySQL.prototype.bigincrements = 'bigint unsigned not null auto_increment primary key';
ColumnCompiler_MySQL.prototype.bigint = 'bigint';
ColumnCompiler_MySQL.prototype.double = function(precision, scale) {
  if (!precision) return 'double';
  return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};
ColumnCompiler_MySQL.prototype.integer = function(length) {
  length = length ? '(' + this._num(length, 11) + ')' : '';
  return 'int' + length;
};
ColumnCompiler_MySQL.prototype.mediumint = 'mediumint';
ColumnCompiler_MySQL.prototype.smallint = 'smallint';
ColumnCompiler_MySQL.prototype.tinyint = function(length) {
  length = length ? '(' + this._num(length, 1) + ')' : '';
  return 'tinyint' + length;
};
ColumnCompiler_MySQL.prototype.text = function(column) {
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
};
ColumnCompiler_MySQL.prototype.mediumtext = function() {
  return this.text('medium');
};
ColumnCompiler_MySQL.prototype.longtext = function() {
  return this.text('long');
};
ColumnCompiler_MySQL.prototype.enu = function(allowed) {
  return "enum('" + allowed.join("', '")  + "')";
};
ColumnCompiler_MySQL.prototype.datetime = 'datetime';
ColumnCompiler_MySQL.prototype.timestamp = 'timestamp';
ColumnCompiler_MySQL.prototype.bit = function(length) {
  return length ? 'bit(' + this._num(length) + ')' : 'bit';
};

// Modifiers
// ------

ColumnCompiler_MySQL.prototype.defaultTo = function(value) {
  /*jshint unused: false*/
  var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
  if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
    return defaultVal;
  }
  return '';
};
ColumnCompiler_MySQL.prototype.unsigned = function() {
  return 'unsigned';
};
ColumnCompiler_MySQL.prototype.first = function() {
  return 'first';
};
ColumnCompiler_MySQL.prototype.after = function(column) {
  return 'after ' + this.formatter.wrap(column);
};
ColumnCompiler_MySQL.prototype.comment = function(comment) {
  if (comment && comment.length > 255) {
    helpers.warn('Your comment is longer than the max comment length for MySQL');
  }
  return comment && "comment '" + comment + "'";
};

client.ColumnBuilder = ColumnBuilder_MySQL;
client.ColumnCompiler = ColumnCompiler_MySQL;

};
