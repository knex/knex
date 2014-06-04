// PostgreSQL Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Column Builder
// ------

function ColumnBuilder_PG() {
  this.client = client;
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_PG, Schema.ColumnBuilder);

function ColumnCompiler_PG() {
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
  this.Formatter = client.Formatter;
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_PG, Schema.ColumnCompiler);

// Types
// ------
ColumnCompiler_PG.prototype.bigincrements = 'bigserial primary key';
ColumnCompiler_PG.prototype.bigint = 'bigint';
ColumnCompiler_PG.prototype.binary = 'bytea';
ColumnCompiler_PG.prototype.bit = function(column) {
  return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
};
ColumnCompiler_PG.prototype.bool = 'boolean';

// Create the column definition for an enum type.
// Using method "2" here: http://stackoverflow.com/a/10984951/525714
ColumnCompiler_PG.prototype.enu = function(allowed) {
  return 'text check (' + this.args[0] + " in ('" + allowed.join("', '")  + "'))";
};

ColumnCompiler_PG.prototype.double = 'double precision',
ColumnCompiler_PG.prototype.floating = 'real',
ColumnCompiler_PG.prototype.increments = 'serial primary key',
ColumnCompiler_PG.prototype.json = function() {
  if (!client.version || parseFloat(client.version) >= 9.2) return 'json';
  return 'text';
};
ColumnCompiler_PG.prototype.smallint =
ColumnCompiler_PG.prototype.tinyint = 'smallint';
ColumnCompiler_PG.prototype.datetime =
ColumnCompiler_PG.prototype.timestamp = function(without) {
  return without ? 'timestamp' : 'timestamptz';
};
ColumnCompiler_PG.prototype.uuid = 'uuid';

// Modifiers:
// ------
ColumnCompiler_PG.prototype.comment = function(comment) {
  this.pushAdditional(function() {
    this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
      this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL'));
  }, comment);
};

client.ColumnBuilder = ColumnBuilder_PG;
client.ColumnCompiler = ColumnCompiler_PG;

};