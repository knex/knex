'use strict';

exports.__esModule = true;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _raw = require('../raw');

var _raw2 = _interopRequireDefault(_raw);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ColumnCompiler(client, tableCompiler, columnBuilder) {
  this.client = client;
  this.tableCompiler = tableCompiler;
  this.columnBuilder = columnBuilder;
  this.args = columnBuilder._args;
  this.type = columnBuilder._type.toLowerCase();
  this.grouped = (0, _lodash.groupBy)(columnBuilder._statements, 'grouping');
  this.modified = columnBuilder._modifiers;
  this.isIncrements = this.type.indexOf('increments') !== -1;
  this.formatter = client.formatter(columnBuilder);
  this.sequence = [];
  this.modifiers = [];
}
// Column Compiler
// Used for designating column definitions
// during the table "create" / "alter" statements.
// -------


ColumnCompiler.prototype.pushQuery = helpers.pushQuery;

ColumnCompiler.prototype.pushAdditional = helpers.pushAdditional;

ColumnCompiler.prototype.unshiftQuery = helpers.unshiftQuery;

ColumnCompiler.prototype._defaultMap = {
  'columnName': function columnName() {
    if (!this.isIncrements) {
      throw new Error('You did not specify a column name for the ' + this.type + ' column.');
    }
    return 'id';
  }
};

ColumnCompiler.prototype.defaults = function (label) {
  if (this._defaultMap.hasOwnProperty(label)) {
    return this._defaultMap[label].bind(this)();
  } else {
    throw new Error('There is no default for the specified identifier ' + label);
  }
};

// To convert to sql, we first go through and build the
// column as it would be in the insert statement
ColumnCompiler.prototype.toSQL = function () {
  this.pushQuery(this.compileColumn());
  if (this.sequence.additional) {
    this.sequence = this.sequence.concat(this.sequence.additional);
  }
  return this.sequence;
};

// Compiles a column.
ColumnCompiler.prototype.compileColumn = function () {
  return this.formatter.wrap(this.getColumnName()) + ' ' + this.getColumnType() + this.getModifiers();
};

// Assumes the autoincrementing key is named `id` if not otherwise specified.
ColumnCompiler.prototype.getColumnName = function () {
  var value = (0, _lodash.first)(this.args);
  return value || this.defaults('columnName');
};

ColumnCompiler.prototype.getColumnType = function () {
  var type = this[this.type];
  return typeof type === 'function' ? type.apply(this, (0, _lodash.tail)(this.args)) : type;
};

ColumnCompiler.prototype.getModifiers = function () {
  var modifiers = [];

  for (var i = 0, l = this.modifiers.length; i < l; i++) {
    var modifier = this.modifiers[i];

    //Cannot allow 'nullable' modifiers on increments types
    if (!this.isIncrements || this.isIncrements && modifier === 'comment') {
      if ((0, _lodash.has)(this.modified, modifier)) {
        var val = this[modifier].apply(this, this.modified[modifier]);
        if (val) modifiers.push(val);
      }
    }
  }

  return modifiers.length > 0 ? ' ' + modifiers.join(' ') : '';
};

// Types
// ------

ColumnCompiler.prototype.increments = 'integer not null primary key autoincrement';
ColumnCompiler.prototype.bigincrements = 'integer not null primary key autoincrement';
ColumnCompiler.prototype.integer = ColumnCompiler.prototype.smallint = ColumnCompiler.prototype.mediumint = 'integer';
ColumnCompiler.prototype.biginteger = 'bigint';
ColumnCompiler.prototype.varchar = function (length) {
  return 'varchar(' + this._num(length, 255) + ')';
};
ColumnCompiler.prototype.text = 'text';
ColumnCompiler.prototype.tinyint = 'tinyint';
ColumnCompiler.prototype.floating = function (precision, scale) {
  return 'float(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};
ColumnCompiler.prototype.decimal = function (precision, scale) {
  if (precision === null) {
    throw new Error('Specifying no precision on decimal columns is not supported for that SQL dialect.');
  }
  return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};
ColumnCompiler.prototype.binary = 'blob';
ColumnCompiler.prototype.bool = 'boolean';
ColumnCompiler.prototype.date = 'date';
ColumnCompiler.prototype.datetime = 'datetime';
ColumnCompiler.prototype.time = 'time';
ColumnCompiler.prototype.timestamp = 'timestamp';
ColumnCompiler.prototype.enu = 'varchar';

ColumnCompiler.prototype.bit = ColumnCompiler.prototype.json = 'text';

ColumnCompiler.prototype.uuid = 'char(36)';
ColumnCompiler.prototype.specifictype = function (type) {
  return type;
};

// Modifiers
// -------

ColumnCompiler.prototype.nullable = function (nullable) {
  return nullable === false ? 'not null' : 'null';
};
ColumnCompiler.prototype.notNullable = function () {
  return this.nullable(false);
};
ColumnCompiler.prototype.defaultTo = function (value) {
  if (value === void 0) {
    return '';
  } else if (value === null) {
    value = "null";
  } else if (value instanceof _raw2.default) {
    value = value.toQuery();
  } else if (this.type === 'bool') {
    if (value === 'false') value = 0;
    value = '\'' + (value ? 1 : 0) + '\'';
  } else if (this.type === 'json' && (0, _lodash.isObject)(value)) {
    return (0, _stringify2.default)(value);
  } else {
    value = '\'' + value + '\'';
  }
  return 'default ' + value;
};
ColumnCompiler.prototype._num = function (val, fallback) {
  if (val === undefined || val === null) return fallback;
  var number = parseInt(val, 10);
  return isNaN(number) ? fallback : number;
};

exports.default = ColumnCompiler;
module.exports = exports['default'];