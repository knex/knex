var _ = require('lodash');

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(builder) {
  this.builder   = builder;
  this.formatter = new this.Formatter();
  this.sequence  = [];
}

SchemaCompiler.prototype.toSQL = function() {
  var sequence = this.builder._sequence;
  for (var i = 0, l = sequence.length; i < l; i++) {
    var query = sequence[i];
    this[query.method].apply(this, query.args);
  }
  return this.sequence;
};

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
SchemaCompiler.prototype.pushQuery = function(query) {
  if (_.isString(query)) {
    query = {sql: query};
  } else {
    query = query;
  }
  query.bindings = this.formatter.bindings;
  this.sequence.push(query);
  this.formatter = new this.Formatter();
};

SchemaCompiler.prototype.createTable = function(tableName, fn) {
  new this.client.TableCompiler(this, new this.client.TableBuilder(tableName)._create(fn)).toSQL('create');
};
SchemaCompiler.prototype.alterTable = function(tableName, fn) {
  new this.client.TableCompiler(this, new this.client.TableBuilder(tableName)._alter(fn)).toSQL('alter');
};
SchemaCompiler.prototype.dropTable = function(tableName) {
  this.pushQuery('drop table ' + this.formatter.wrap(tableName));
};
SchemaCompiler.prototype.dropTableIfExists = function(tableName) {
  this.pushQuery('drop table if exists ' + this.formatter.wrap(tableName));
};

module.exports = SchemaCompiler;