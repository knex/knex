// PostgreSQL Table Builder & Compiler
// -------

'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var TableCompiler = require('../../../schema/tablecompiler');

function TableCompiler_PG() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_PG, TableCompiler);

// Compile a rename column command.
TableCompiler_PG.prototype.renameColumn = function (from, to) {
  return this.pushQuery({
    sql: 'alter table ' + this.tableName() + ' rename ' + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
  });
};

TableCompiler_PG.prototype.compileAdd = function (builder) {
  var table = this.formatter.wrap(builder);
  var columns = this.prefixArray('add column', this.getColumns(builder));
  return this.pushQuery({
    sql: 'alter table ' + table + ' ' + columns.join(', ')
  });
};

// Adds the "create" query to the query sequence.
TableCompiler_PG.prototype.createQuery = function (columns, ifNot) {
  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
  this.pushQuery({
    sql: createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')',
    bindings: columns.bindings
  });
  var hasComment = _.has(this.single, 'comment');
  if (hasComment) this.comment(this.single.comment);
};

// Compiles the comment on the table.
TableCompiler_PG.prototype.comment = function (comment) {
  /*jshint unused: false*/
  this.pushQuery('comment on table ' + this.tableName() + ' is ' + '\'' + (this.single.comment || '') + '\'');
};

// Indexes:
// -------

TableCompiler_PG.prototype.primary = function (columns) {
  this.pushQuery('alter table ' + this.tableName() + ' add primary key (' + this.formatter.columnize(columns) + ')');
};
TableCompiler_PG.prototype.unique = function (columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')');
};
TableCompiler_PG.prototype.index = function (columns, indexName, indexType) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + (indexType && ' using ' + indexType || '') + ' (' + this.formatter.columnize(columns) + ')');
};
TableCompiler_PG.prototype.dropPrimary = function () {
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + this.tableNameRaw + '_pkey');
};
TableCompiler_PG.prototype.dropIndex = function (columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('drop index ' + indexName);
};
TableCompiler_PG.prototype.dropUnique = function (columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
};
TableCompiler_PG.prototype.dropForeign = function (columns, indexName) {
  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
};

module.exports = TableCompiler_PG;