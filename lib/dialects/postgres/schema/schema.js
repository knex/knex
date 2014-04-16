// PostgreSQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_PG() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_PG, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_PG() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_PG, Schema.Compiler);

// Check whether the current table
SchemaCompiler_PG.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_name = ?',
    bindings: [tableName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_PG.prototype.hasColumn = function(tableName, columnName) {
  this.pushQuery({
    sql: 'select * from information_schema.columns where table_name = ? and column_name = ?',
    bindings: [tableName, columnName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile a rename table command.
SchemaCompiler_PG.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

client.SchemaBuilder = SchemaBuilder_PG;
client.SchemaCompiler = SchemaCompiler_PG;

};