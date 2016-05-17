
import {assign, uniq, map} from 'lodash'
var inherits       = require('inherits')
var Raw            = require('../../../raw')
var ColumnCompiler = require('../../../schema/columncompiler')

// Column Compiler
// -------

function ColumnCompiler_Sqlanywhere() {
  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
  ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_Sqlanywhere, ColumnCompiler);

assign(ColumnCompiler_Sqlanywhere.prototype, {

  increments: function () {
    return 'integer not null primary key default autoincrement';
  },

  bigincrements: function () {
    return 'bigint not null primary key default autoincrement';
  },

  floating: function(precision) {
    var parsedPrecision = this._num(precision, 0);
    return 'float' + (parsedPrecision ? '(' + parsedPrecision + ')' : '');
  },

  double: function(precision, scale) {
    if (!precision) return 'double';
    return 'numeric(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },

  integer: function(length) {
      return length ? 'numeric(' + this._num(length, 11) + ', 0)' : 'integer';
  },

  tinyint: 'tinyint',

  smallint: 'smallint',

  mediumint: 'integer',

  biginteger: 'bigint',

  text: 'long varchar',
   
  binary: 'long binary',

  enu: function (allowed) {
    allowed = uniq(allowed);
    var maxLength = (allowed || []).reduce(function (maxLength, name) {
      return Math.max(maxLength, String(name).length);
    }, 1);

    // implicitly add the enum values as checked values
    this.columnBuilder._modifiers.checkIn = [allowed];

    return "varchar(" + maxLength + ")";
  },

  time: 'timestamp with time zone',

  datetime: function(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  },

  timestamp: function(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  },

  bit: 'bit',

  json: 'long varchar',

  bool: function () {
    return 'bit';
  },

  varchar: function(length) {
    return 'varchar(' + this._num(length, 255) + ')';
  },

  // Modifiers
  // ------

  comment: function(comment) {
    this.pushAdditional(function() {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
        this.formatter.wrap(this.args[0]) + " is '" + (comment || '')+ "'");
    }, comment);
  },

  checkIn: function (value) {
    // TODO: Maybe accept arguments also as array
    // TODO: value(s) should be escaped properly
    if (value === undefined) {
      return '';
    } else if (value instanceof Raw) {
      value = value.toQuery();
    } else if (Array.isArray(value)) {
      value = map(value, function (v) {
        return "'" + v + "'";
      }).join(', ');
    } else {
      value = "'" + value + "'";
    }
    return 'check (' + this.formatter.wrap(this.args[0]) + ' in (' + value + '))';
  }

});

module.exports = ColumnCompiler_Sqlanywhere;
