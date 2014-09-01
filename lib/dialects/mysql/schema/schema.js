'use strict';

// MySQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_MySQL() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_MySQL, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_MySQL() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_MySQL, Schema.Compiler);

// Rename a table on the schema.
SchemaCompiler_MySQL.prototype.renameTable = function(tableName, to) {
  this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
};

// Check whether a table exists on the query.
SchemaCompiler_MySQL.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_schema = ' +
      this.formatter.parameter(client.database()) +
      ' and table_name = ' +
      this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

// Check whether a column exists on the schema.
SchemaCompiler_MySQL.prototype.hasColumn = function(tableName, column) {
  this.pushQuery({
    sql: 'show columns from ' + this.formatter.wrap(tableName) +
      ' like ' + this.formatter.parameter(column),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

client.SchemaBuilder = SchemaBuilder_MySQL;
client.SchemaCompiler = SchemaCompiler_MySQL;

};