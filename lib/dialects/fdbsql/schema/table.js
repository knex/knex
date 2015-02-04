'use strict';

// FDBSQL Table Builder & Compiler
// This file was adapted from the PostgreSQL Table Builder & Compiler

module.exports = function(client) {

//var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');
var _ = require('lodash');

// Table
// ------

function TableBuilder_FDB() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_FDB, Schema.TableBuilder);

function TableCompiler_FDB() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_FDB, Schema.TableCompiler);

// Compile a rename column command.
TableCompiler_FDB.prototype.renameColumn = function(from, to) {
  return this.pushQuery({
    sql: 'alter table ' + this.tableName() + ' rename column '+ this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
  });
};

TableCompiler_FDB.prototype.addColumns = function(columns) {
  if (columns.sql.length > 0) {
    var columnSql = _.map(columns.sql, function(column) {
      return this.addColumnsPrefix + column;
    }, this);
    for (var i = 0; i < columns.sql.length; i++) {
      this.pushQuery({
        sql: 'alter table ' + this.tableName() + ' ' + columnSql[i],
        bindings: columns.bindings
      });
    }
  }
};

// Adds the "create" query to the query sequence.
TableCompiler_FDB.prototype.createQuery = function(columns, ifNot) {
  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
  this.pushQuery({
    sql: createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')',
    bindings: columns.bindings
  });
};

// Indexes:
// -------

TableCompiler_FDB.prototype.primary = function(columns) {
  this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
};
TableCompiler_FDB.prototype.unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName +
    ' unique (' + this.formatter.columnize(columns) + ')');
};
TableCompiler_FDB.prototype.index = function(columns, indexName, indexType) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + (indexType && (' using ' + indexType) || '') +
    ' (' + this.formatter.columnize(columns) + ')');
};
TableCompiler_FDB.prototype.dropPrimary = function() {
  this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
};
TableCompiler_FDB.prototype.dropIndex = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('drop index ' + indexName);
};
TableCompiler_FDB.prototype.dropUnique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop unique ' + indexName);
};
TableCompiler_FDB.prototype.dropForeign = function(columns, indexName) {
  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
};

client.TableBuilder = TableBuilder_FDB;
client.TableCompiler = TableCompiler_FDB;

};
