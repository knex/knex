var _            = require('lodash');
var SqlString    = require('../sqlstring');

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
var SchemaBuilder = function() {
  this._sequence    = [];
};

// Create a new table on the schema.
SchemaBuilder.prototype.createTable = function(tableName, fn) {
  this._sequence.push({
    method: 'createTable',
    tableName: tableName,
    value: fn
  });
  return this;
};

// Modify a table on the schema,
// aliased for `schema.alterTable` for clarity.
SchemaBuilder.prototype.table =
SchemaBuilder.prototype.alterTable = function(tableName, fn) {
  this._sequence.push({
    method: 'alterTable',
    tableName: tableName,
    value: fn
  });
  return this;
};

// Drop a table from the schema.
SchemaBuilder.prototype.dropTable = function(tableName) {
  this._sequence.push({
    method: 'dropTable',
    value: tableName
  });
  return this;
};

// Drop a table from the schema if it exists.
SchemaBuilder.prototype.dropTableIfExists = function(tableName) {
  this._sequence.push({
    method: 'dropTableIfExists',
    value: tableName
  });
  return this;
};

// Add a "raw" statement to the sequence.
SchemaBuilder.prototype.raw = function(query, bindings) {
  this._sequence.push({
    method: 'raw',
    value: query,
    bindings: bindings
  });
  return this;
};

// return '[object Knex:SchemaBuilder]';
SchemaBuilder.prototype.toString = function() {
  return this.toQuery();
};

// Turn the current schema builder into a string...
SchemaBuilder.prototype.toQuery = function() {
  return _.reduce(this.toSql(), function(memo, statement) {
    memo.push(SqlString.format(statement.sql, statement.bindings));
    return memo;
  }, []).join(';\n') + ';';
};

require('../interface')(SchemaBuilder);

return SchemaBuilder;