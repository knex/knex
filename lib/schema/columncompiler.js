'use strict';

exports.__esModule = true;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _isObject2 = require('lodash/isObject');

var _isObject3 = _interopRequireDefault(_isObject2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _tail2 = require('lodash/tail');

var _tail3 = _interopRequireDefault(_tail2);

var _first2 = require('lodash/first');

var _first3 = _interopRequireDefault(_first2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _raw = require('../raw');

var _raw2 = _interopRequireDefault(_raw);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Column Compiler
// Used for designating column definitions
// during the table "create" / "alter" statements.
// -------
function ColumnCompiler(client, tableCompiler, columnBuilder) {
  this.client = client;
  this.tableCompiler = tableCompiler;
  this.columnBuilder = columnBuilder;
  this.args = columnBuilder._args;
  this.type = columnBuilder._type.toLowerCase();
  this.grouped = (0, _groupBy3.default)(columnBuilder._statements, 'grouping');
  this.modified = columnBuilder._modifiers;
  this.isIncrements = this.type.indexOf('increments') !== -1;
  this.formatter = client.formatter();
  this.sequence = [];
  this.modifiers = [];
}

ColumnCompiler.prototype.pushQuery = helpers.pushQuery;

ColumnCompiler.prototype.pushAdditional = helpers.pushAdditional;

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
  var value = (0, _first3.default)(this.args);
  if (value) return value;
  if (this.isIncrements) {
    return 'id';
  } else {
    throw new Error('You did not specify a column name for the ' + this.type + 'column.');
  }
};

ColumnCompiler.prototype.getColumnType = function () {
  var type = this[this.type];
  return typeof type === 'function' ? type.apply(this, (0, _tail3.default)(this.args)) : type;
};

ColumnCompiler.prototype.getModifiers = function () {
  var modifiers = [];
  if (this.type.indexOf('increments') === -1) {
    for (var i = 0, l = this.modifiers.length; i < l; i++) {
      var modifier = this.modifiers[i];
      if ((0, _has3.default)(this.modified, modifier)) {
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
  } else if (this.type === 'json' && (0, _isObject3.default)(value)) {
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