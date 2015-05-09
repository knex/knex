'use strict';

var assign = require('lodash/object/assign');
var inherits = require('inherits');

// Ensure the client has fresh objects so we can tack onto
// the prototypes without mutating them globally.
module.exports = function makeClient(ParentClient) {

  if (typeof ParentClient.prototype === 'undefined') {
    throw new Error('A valid parent client must be passed to makeClient');
  }

  function Client(config) {
    ParentClient.call(this, config);
  }
  inherits(Client, ParentClient);

  function Formatter(client) {
    Formatter.super_.call(this, client);
  }
  inherits(Formatter, ParentClient.prototype.Formatter);

  function QueryBuilder(client) {
    QueryBuilder.super_.call(this, client);
  }
  inherits(QueryBuilder, ParentClient.prototype.QueryBuilder);

  function SchemaBuilder(client) {
    SchemaBuilder.super_.call(this, client);
  }
  inherits(SchemaBuilder, ParentClient.prototype.SchemaBuilder);

  function SchemaCompiler(client, builder) {
    SchemaCompiler.super_.call(this, client, builder);
  }
  inherits(SchemaCompiler, ParentClient.prototype.SchemaCompiler);

  function TableBuilder(client, method, tableName, fn) {
    TableBuilder.super_.call(this, client, method, tableName, fn);
  }
  inherits(TableBuilder, ParentClient.prototype.TableBuilder);

  function TableCompiler(client, tableBuilder) {
    TableCompiler.super_.call(this, client, tableBuilder);
  }
  inherits(TableCompiler, ParentClient.prototype.TableCompiler);

  function ColumnBuilder(client, tableBuilder, type, args) {
    ColumnBuilder.super_.call(this, client, tableBuilder, type, args);
  }
  inherits(ColumnBuilder, ParentClient.prototype.ColumnBuilder);

  function ColumnCompiler(client, tableCompiler, columnBuilder) {
    ColumnCompiler.super_.call(this, client, tableCompiler, columnBuilder);
  }
  inherits(ColumnCompiler, ParentClient.prototype.ColumnCompiler);

  assign(Client.prototype, {
    Formatter: Formatter,
    QueryBuilder: QueryBuilder,
    SchemaBuilder: SchemaBuilder,
    SchemaCompiler: SchemaCompiler,
    TableBuilder: TableBuilder,
    TableCompiler: TableCompiler,
    ColumnBuilder: ColumnBuilder,
    ColumnCompiler: ColumnCompiler
  });

  return Client;
};