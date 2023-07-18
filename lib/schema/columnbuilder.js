const extend = require('lodash/extend');
const assign = require('lodash/assign');
const toArray = require('lodash/toArray');
const { addQueryContext } = require('../util/helpers');

// The chainable interface off the original "column" method.
class ColumnBuilder {
  constructor(client, tableBuilder, type, args) {
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
      extend(this, AlterMethods);
    }
  }

  // Specify that the current column "references" a column,
  // which may be tableName.column or just "column"
  references(value) {
    return this._tableBuilder.foreign
      .call(this._tableBuilder, this._args[0], undefined, this)
      ._columnBuilder(this)
      .references(value);
  }
}

// All of the modifier methods that can be used to modify the current query.
const modifiers = [
  'default',
  'defaultsTo',
  'defaultTo',
  'unsigned',
  'nullable',
  'first',
  'after',
  'comment',
  'collate',
  'check',
  'checkPositive',
  'checkNegative',
  'checkIn',
  'checkNotIn',
  'checkBetween',
  'checkLength',
  'checkRegex',
];

// Aliases for convenience.
const aliasMethod = {
  default: 'defaultTo',
  defaultsTo: 'defaultTo',
};

// If we call any of the modifiers (index or otherwise) on the chainable, we pretend
// as though we're calling `table.method(column)` directly.
modifiers.forEach(function (method) {
  const key = aliasMethod[method] || method;
  ColumnBuilder.prototype[method] = function () {
    this._modifiers[key] = toArray(arguments);
    return this;
  };
});

addQueryContext(ColumnBuilder);

ColumnBuilder.prototype.notNull = ColumnBuilder.prototype.notNullable =
  function notNullable() {
    return this.nullable(false);
  };

['index', 'primary', 'unique'].forEach(function (method) {
  ColumnBuilder.prototype[method] = function () {
    if (this._type.toLowerCase().indexOf('increments') === -1) {
      this._tableBuilder[method].apply(
        this._tableBuilder,
        [this._args[0]].concat(toArray(arguments))
      );
    }
    return this;
  };
});

ColumnBuilder.extend = (methodName, fn) => {
  if (
    Object.prototype.hasOwnProperty.call(ColumnBuilder.prototype, methodName)
  ) {
    throw new Error(
      `Can't extend ColumnBuilder with existing method ('${methodName}').`
    );
  }

  assign(ColumnBuilder.prototype, { [methodName]: fn });
};

const AlterMethods = {};

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
    value: type,
  });

  return this;
};

// Set column method to alter (default is add).
AlterMethods.alter = function ({
  alterNullable = true,
  alterType = true,
} = {}) {
  this._method = 'alter';
  this.alterNullable = alterNullable;
  this.alterType = alterType;

  return this;
};

// Alias a few methods for clarity when processing.
const columnAlias = {
  float: 'floating',
  enum: 'enu',
  boolean: 'bool',
  string: 'varchar',
  bigint: 'bigInteger',
};

module.exports = ColumnBuilder;
