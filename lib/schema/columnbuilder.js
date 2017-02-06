'use strict';

exports.__esModule = true;

var _toArray2 = require('lodash/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _extend2 = require('lodash/extend');

var _extend3 = _interopRequireDefault(_extend2);

exports.default = ColumnBuilder;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The chainable interface off the original "column" method.
function ColumnBuilder(client, tableBuilder, type, args) {
  this.client = client;
  this._single = {};
  this._modifiers = {};
  this._statements = [];
  this._type = columnAlias[type] || type;
  this._args = args;
  this._tableBuilder = tableBuilder;

  // If we're altering the table, extend the object
  // with the available "alter" methods.
  if (tableBuilder._method === 'alter') {
    (0, _extend3.default)(this, AlterMethods);
  }
}

// All of the modifier methods that can be used to modify the current query.
var modifiers = ['default', 'defaultsTo', 'defaultTo', 'unsigned', 'nullable', 'first', 'after', 'comment', 'collate'];

// Aliases for convenience.
var aliasMethod = {
  default: 'defaultTo',
  defaultsTo: 'defaultTo'
};

// If we call any of the modifiers (index or otherwise) on the chainable, we pretend
// as though we're calling `table.method(column)` directly.
(0, _each3.default)(modifiers, function (method) {
  var key = aliasMethod[method] || method;
  ColumnBuilder.prototype[method] = function () {
    this._modifiers[key] = (0, _toArray3.default)(arguments);
    return this;
  };
});

ColumnBuilder.prototype.notNull = ColumnBuilder.prototype.notNullable = function notNullable() {
  return this.nullable(false);
};

(0, _each3.default)(['index', 'primary', 'unique'], function (method) {
  ColumnBuilder.prototype[method] = function () {
    if (this._type.toLowerCase().indexOf('increments') === -1) {
      this._tableBuilder[method].apply(this._tableBuilder, [this._args[0]].concat((0, _toArray3.default)(arguments)));
    }
    return this;
  };
});

// Specify that the current column "references" a column,
// which may be tableName.column or just "column"
ColumnBuilder.prototype.references = function (value) {
  return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], this)._columnBuilder(this).references(value);
};

var AlterMethods = {};

// Specify that the column is to be dropped. This takes precedence
// over all other rules for the column.
AlterMethods.drop = function () {
  this._single.drop = true;
  return this;
};

// Specify the "type" that we're looking to set the
// Knex takes no responsibility for any data-loss that may
// occur when changing data types.
AlterMethods.alterType = function (type) {
  this._statements.push({
    grouping: 'alterType',
    value: type
  });
  return this;
};

// Alias a few methods for clarity when processing.
var columnAlias = {
  'float': 'floating',
  'enum': 'enu',
  'boolean': 'bool',
  'string': 'varchar',
  'bigint': 'bigInteger'
};
module.exports = exports['default'];