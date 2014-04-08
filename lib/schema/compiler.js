var _ = require('lodash');

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(sequence, single) {
  this.formatter = new this.Formatter();
  this.sequence  = [];
}

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
SchemaCompiler.prototype.push = function(query) {
  if (_.isString(query)) {
    query = {sql: query};
  } else {
    query = query;
  }
  query.bindings = this.formatter.bindings;
  this.sequence.push(query);
  this.formatter = new this.Formatter();

  // Eh, why not.
  return this.sequence.length;
};

SchemaCompiler.prototype.createTable = function(tableName, fn) {
  new this.client.TableCompiler(this, new this.client.TableBuilder(tableName)._create(fn)).create();
};
SchemaCompiler.prototype.alterTable = function(tableName, fn) {
  new this.client.TableCompiler(this, new this.client.TableBuilder(tableName)._alter(fn)).alter();
};
SchemaCompiler.prototype.dropTable = function(tableName) {
  this.push('drop table ' + this.formatter.wrap(tableName));
};
SchemaCompiler.prototype.dropTableIfExists = function(tableName) {
  this.push('drop table if exists ' + this.formatter.wrap(tableName));
};

module.exports = SchemaCompiler;