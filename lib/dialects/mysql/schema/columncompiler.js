'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function supportsPreciseTimestamps(client) {
  if (!client.version) {
    var message = 'To get rid of this warning you should specify the mysql dialect version in ' + 'your knex configuration. Currently this defaults to 5.5, but in a future ' + 'release it will default to 5.6 which supports high precision timestamps. ' + 'See http://knexjs.org/#Schema-timestamps for more information.';
    client.logger.warn(message);
  }

  return client.version && parseFloat(client.version) > 5.5;
}
// MySQL Column Compiler
// -------


function ColumnCompiler_MySQL() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'comment', 'collate', 'first', 'after'];
}
(0, _inherits2.default)(ColumnCompiler_MySQL, _columncompiler2.default);

// Types
// ------

(0, _lodash.assign)(ColumnCompiler_MySQL.prototype, {

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
    return 'enum(\'' + allowed.join("', '") + '\')';
  },
  datetime: function datetime() {
    return supportsPreciseTimestamps(this.client) ? 'datetime(6)' : 'datetime';
  },
  timestamp: function timestamp() {
    return supportsPreciseTimestamps(this.client) ? 'timestamp(6)' : 'timestamp';
  },
  bit: function bit(length) {
    return length ? 'bit(' + this._num(length) + ')' : 'bit';
  },
  binary: function binary(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'blob';
  },
  json: function json() {
    return 'json';
  },


  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },
  unsigned: function unsigned() {
    return 'unsigned';
  },
  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      this.client.logger.warn('Your comment is longer than the max comment length for MySQL');
    }
    return _comment && 'comment \'' + _comment + '\'';
  },
  first: function first() {
    return 'first';
  },
  after: function after(column) {
    return 'after ' + this.formatter.wrap(column);
  },
  collate: function collate(collation) {
    return collation && 'collate \'' + collation + '\'';
  }
});

exports.default = ColumnCompiler_MySQL;
module.exports = exports['default'];