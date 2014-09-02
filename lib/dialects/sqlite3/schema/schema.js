'use strict';

// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_SQLite3() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_SQLite3, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_SQLite3() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_SQLite3, Schema.Compiler);

// Compile the query to determine if a table exists.
SchemaCompiler_SQLite3.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: "select * from sqlite_master where type = 'table' and name = " + this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

// Compile the query to determine if a column exists.
SchemaCompiler_SQLite3.prototype.hasColumn = function(tableName, column) {
  this.pushQuery({
    sql: 'PRAGMA table_info(' + this.formatter.wrap(tableName) + ')',
    output: function(resp) {
      return _.some(resp, {name: column});
    }
  });
};

// Compile a rename table command.
SchemaCompiler_SQLite3.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

client.SchemaBuilder = SchemaBuilder_SQLite3;
client.SchemaCompiler = SchemaCompiler_SQLite3;

};