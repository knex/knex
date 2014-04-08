var _ = require('lodash');

// The chainable interface off the original "column" method.
var ColumnBuilder = function(method, column) {
  this._single     = {};
  this._statements = [];
  this._method     = method;
  this._column     = column;
};

// Specify that the column is to be dropped. This takes precedence
// over all other rules for the column.
ColumnBuilder.prototype.drop = function() {
  this._single.drop = true;
  return this;
};

// Specify the "type" that we're looking to set the
// Knex takes no responsibility for any data-loss that may
// occur when changing data types.
ColumnBuilder.prototype.alterType = function(type) {
  this._statements.push({
    grouping: 'alterType',
    value: type
  });
  return this;
};

// All of the modifier methods that can be used to modify the current query.
var modifiers = [
  'defaultsTo', 'defaultTo', 'unsigned',
  'nullable', 'notNull', 'notNullable',
  'after', 'comment'
];

// Aliases for convenience.
var aliasMethod = {
  defaultsTo: 'defaultTo',
  notNull: 'notNullable'
};

// If we call any of the "indexMethods" on the chainable, we pretend
// as though we're calling `table.method(column)` directly.
_.each(modifiers, function(method) {
  ColumnBuilder.prototype[method] = function() {
    var args = _.toArray(arguments);
    if (aliasMethod[method]) {
      method = aliasMethod[method];
    }
    this._statements.push({
      grouping: 'modifiers',
      method: method,
    });
    return this;
  };
});

// Specify that the current column "references" a column,
// which may be tableName.column or just "column"
ColumnBuilder.prototype.references = function(value) {
  this._statements.push({
    grouping: 'fk',
    method: 'references',
    value: value
  });
  _.extend(this, ForeignChain);
  return this;
};

// Setup all of the "ForeignChain" methods, which are available to us
// after `references` is called.
var ForeignChain = {};

// The starting interface for specifying a foreign key on column creation.
_.each(['on', 'inTable', 'onUpdate', 'onDelete'], function(method) {
  ForeignChain[method] = function(value) {
    this._statements.push({
      grouping: 'fk',
      method: method,
      value: value
    });
    return this;
  };
});
