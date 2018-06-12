'use strict';

exports.__esModule = true;
exports.default = ColumnBuilder;

var _lodash = require('lodash');

var _helpers = require('../helpers');

// The chainable interface off the original "column" method.
function ColumnBuilder(client, tableBuilder, type, args) {
  this.client = client;
  this._method = 'add';
  this._single = {};
  this._modifiers = {};
  this._statements = [];
  this._type = columnAlias[type] || type;
  this._args = args;
  this._tableBuilder = tableBuilder;

  // If we're altering the table, extend the object
  // with the available "alter" methods.
  if (tableBuilder._method === 'alter') {
    (0, _lodash.extend)(this, AlterMethods);
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
(0, _lodash.each)(modifiers, function (method) {
  var key = aliasMethod[method] || method;
  ColumnBuilder.prototype[method] = function () {
    this._modifiers[key] = (0, _lodash.toArray)(arguments);
    return this;
  };
});

(0, _helpers.addQueryContext)(ColumnBuilder);

ColumnBuilder.prototype.notNull = ColumnBuilder.prototype.notNullable = function notNullable() {
  return this.nullable(false);
};

(0, _lodash.each)(['index', 'primary', 'unique'], function (method) {
  ColumnBuilder.prototype[method] = function () {
    if (this._type.toLowerCase().indexOf('increments') === -1) {
      this._tableBuilder[method].apply(this._tableBuilder, [this._args[0]].concat((0, _lodash.toArray)(arguments)));
    }
    return this;
  };
});

// Specify that the current column "references" a column,
// which may be tableName.column or just "column"
ColumnBuilder.prototype.references = function (value) {
  return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], undefined, this)._columnBuilder(this).references(value);
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

// Set column method to alter (default is add).
AlterMethods.alter = function () {
  this._method = 'alter';

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