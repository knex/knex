'use strict';

// FDB SQL Layer Column Builder & Compiler
// This file was adapted from the PostgreSQL Column Builder & Compiler

module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Column Builder
// ------

function ColumnBuilder_FDB() {
  this.client = client;
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_FDB, Schema.ColumnBuilder);

function ColumnCompiler_FDB() {
  this.modifiers = ['nullable', 'defaultTo'];
  this.Formatter = client.Formatter;
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_FDB, Schema.ColumnCompiler);

// Types
// ------
ColumnCompiler_FDB.prototype.bigincrements = 'bigserial primary key';
ColumnCompiler_FDB.prototype.bigint = 'bigint';
ColumnCompiler_FDB.prototype.binary = 'blob';

ColumnCompiler_FDB.prototype.bool = 'boolean';

ColumnCompiler_FDB.prototype.double = 'double precision';
ColumnCompiler_FDB.prototype.floating = 'real';
ColumnCompiler_FDB.prototype.increments = 'serial primary key';

ColumnCompiler_FDB.prototype.smallint =
ColumnCompiler_FDB.prototype.tinyint = 'smallint';
ColumnCompiler_FDB.prototype.datetime =
ColumnCompiler_FDB.prototype.timestamp = 'datetime';
ColumnCompiler_FDB.prototype.uuid = 'guid';

// ENUM not supported, fake with VARCHAR
ColumnCompiler_FDB.prototype.enu = function (allowed) {
  var maxLength = (allowed || []).reduce(function (maxLength, name) {
    return Math.max(maxLength, String(name).length);
  }, 1);
  // TODO: Add CHECK when supported.
  return "varchar(" + maxLength + ")";
};

client.ColumnBuilder = ColumnBuilder_FDB;
client.ColumnCompiler = ColumnCompiler_FDB;

};
