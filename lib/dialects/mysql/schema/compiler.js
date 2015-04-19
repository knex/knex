'use strict';

// MySQL Schema Compiler
// -------
var inherits       = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');

function SchemaCompiler_MySQL(client, builder) {
  SchemaCompiler.call(this, client, builder)
}
inherits(SchemaCompiler_MySQL, SchemaCompiler)

// Rename a table on the schema.
SchemaCompiler_MySQL.prototype.renameTable = function(tableName, to) {
  this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
};

// Check whether a table exists on the query.
SchemaCompiler_MySQL.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'show tables like ' + this.formatter.parameter(tableName),
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

module.exports = SchemaCompiler_MySQL;
