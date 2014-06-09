// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Column Builder
// -------

function ColumnBuilder_SQLite3() {
  this.client = client;
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_SQLite3, Schema.ColumnBuilder);

// Column Compiler
// -------

function ColumnCompiler_SQLite3() {
  this.modifiers = ['nullable', 'defaultTo'];
  this.Formatter = client.Formatter;
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_SQLite3, Schema.ColumnCompiler);

// Types
// -------

ColumnCompiler_SQLite3.prototype.double =
ColumnCompiler_SQLite3.prototype.decimal =
ColumnCompiler_SQLite3.prototype.floating = 'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

client.ColumnBuilder = ColumnBuilder_SQLite3;
client.ColumnCompiler = ColumnCompiler_SQLite3;

};