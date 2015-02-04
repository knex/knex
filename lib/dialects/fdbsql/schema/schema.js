'use strict';

// FDB SQL Layer Schema Builder & Compiler
// This file was adapted from the PostgreSQL Schema Builder & Compiler

module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_FDB() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_FDB, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_FDB() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_FDB, Schema.Compiler);

// Check whether the current table
SchemaCompiler_FDB.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_name = ? and table_schema = CURRENT_SCHEMA',
    bindings: [tableName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_FDB.prototype.hasColumn = function(tableName, columnName) {
  this.pushQuery({
    sql: 'select * from information_schema.columns where table_name = ? and column_name = ? and table_schema = CURRENT_SCHEMA',
    bindings: [tableName, columnName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile a rename table command.
SchemaCompiler_FDB.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

SchemaCompiler_FDB.prototype.createSchema = function(schemaName) {
  this.pushQuery('create schema ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_FDB.prototype.createSchemaIfNotExists = function(schemaName) {
  this.pushQuery('create schema if not exists ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_FDB.prototype.dropSchema = function(schemaName) {
  this.pushQuery('drop schema ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_FDB.prototype.dropSchemaIfExists = function(schemaName) {
  this.pushQuery('drop schema if exists ' + this.formatter.wrap(schemaName));
};

client.SchemaBuilder = SchemaBuilder_FDB;
client.SchemaCompiler = SchemaCompiler_FDB;

};
