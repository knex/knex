var _            = require('lodash');
var SqlString    = require('../sqlstring');

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
var SchemaBuilder = function() {
  this._sequence = [];
};

// Create a new table on the schema.
SchemaBuilder.prototype.createTable = function(tableName, fn) {
  this._sequence.push({
    method: 'createTable',
    args: _.toArray(arguments)
  });
  return this;
};

// Modify a table on the schema,
// aliased for `schema.alterTable` for clarity.
SchemaBuilder.prototype.table =
SchemaBuilder.prototype.alterTable = function(tableName, fn) {
  this._sequence.push({
    method: 'alterTable',
    args: _.toArray(arguments)
  });
  return this;
};

// Drop a table from the schema.
SchemaBuilder.prototype.dropTable = function(tableName) {
  this._sequence.push({
    method: 'dropTable',
    args: _.toArray(arguments)
  });
  return this;
};

// Drop a table from the schema if it exists.
SchemaBuilder.prototype.dropTableIfExists = function(tableName) {
  this._sequence.push({
    method: 'dropTableIfExists',
    args: _.toArray(arguments)
  });
  return this;
};

// Add a "raw" statement to the sequence.
SchemaBuilder.prototype.raw = function(query, bindings) {
  this._sequence.push({
    method: 'raw',
    args: _.toArray(arguments)
  });
  return this;
};

// return '[object Knex:SchemaBuilder]';
SchemaBuilder.prototype.toString = function() {
  return this.toQuery();
};

// Turn the current schema builder into a string...
SchemaBuilder.prototype.toQuery = function() {
  return _.reduce(this.toSQL(), function(memo, statement) {
    memo.push(SqlString.format(statement.sql, statement.bindings));
    return memo;
  }, []).join(';\n') + ';';
};

SchemaBuilder.prototype.toSQL = function() {
  var SchemaCompiler = this.client.SchemaCompiler;
  return new SchemaCompiler(this).toSQL();
};

require('../interface')(SchemaBuilder);

return SchemaBuilder;