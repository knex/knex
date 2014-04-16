var _            = require('lodash');
var SqlString    = require('../sqlstring');

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
var SchemaBuilder = function() {
  this._sequence = [];
  this._errors = [];
};

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.
_.each([
  'createTable', 'table', 'alterTable', 'hasTable', 'hasColumn',
  'dropTable', 'renameTable', 'dropTableIfExists', 'raw'
], function(method) {
  SchemaBuilder.prototype[method] = function() {
    if (method === 'table') method = 'alterTable';
    this._sequence.push({
      method: method,
      args: _.toArray(arguments)
    });
    return this;
  };
});

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

module.exports = SchemaBuilder;