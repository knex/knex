'use strict';

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(builder) {
  this.builder = builder;
  this.initCompiler();
}

function buildTable(type) {
  return function(tableName, fn) {
    var TableBuilder = this.client.TableBuilder;
    var sql = new TableBuilder(type, tableName, fn).toSQL();
    for (var i = 0, l = sql.length; i < l; i++) {
      this.sequence.push(sql[i]);
    }
  };
}

SchemaCompiler.prototype.createTable = buildTable('create');
SchemaCompiler.prototype.createTableIfNotExists = buildTable('createIfNot');
SchemaCompiler.prototype.alterTable  = buildTable('alter');

SchemaCompiler.prototype.dropTable = function(tableName) {
  this.pushQuery('drop table ' + this.formatter.wrap(tableName));
};
SchemaCompiler.prototype.dropTableIfExists = function(tableName) {
  this.pushQuery('drop table if exists ' + this.formatter.wrap(tableName));
};
SchemaCompiler.prototype.toSQL = function() {
  var sequence = this.builder._sequence;
  for (var i = 0, l = sequence.length; i < l; i++) {
    var query = sequence[i];
    this[query.method].apply(this, query.args);
  }
  return this.sequence;
};
SchemaCompiler.prototype.raw = function(sql, bindings) {
  this.sequence.push(new this.client.Raw(sql, bindings).toSQL());
};

module.exports = SchemaCompiler;