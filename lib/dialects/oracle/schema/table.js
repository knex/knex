'use strict';

// Oracle Table Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');
var utils    = require('../utils');
var helpers  = require('../../../helpers');

// Table Builder
// ------

function TableBuilder_Oracle() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_Oracle, Schema.TableBuilder);

// Table Compiler
// ------

function TableCompiler_Oracle() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Oracle, Schema.TableCompiler);

// Compile a rename column command.
TableCompiler_Oracle.prototype.renameColumn = function(from, to) {
  return this.pushQuery({
    sql: 'alter table ' + this.tableName() + ' rename column '+ this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
  });
};

TableCompiler_Oracle.prototype.compileAdd = function(builder) {
  var table = this.formatter.wrap(builder);
  var columns = this.prefixArray('add column', this.getColumns(builder));
  return this.pushQuery({
    sql: 'alter table ' + table + ' ' + columns.join(', ')
  });
};

// Adds the "create" query to the query sequence.
TableCompiler_Oracle.prototype.createQuery = function(columns, ifNot) {
  var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';
  this.pushQuery({
    // catch "name is already used by an existing object" for workaround for "if not exists"
    sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
    bindings: columns.bindings
  });
  if (this.single.comment) this.comment(this.single.comment);
};

// Compiles the comment on the table.
TableCompiler_Oracle.prototype.comment = function(comment) {
  this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (comment || '') + "'");
};

TableCompiler_Oracle.prototype.addColumnsPrefix = 'add ';

TableCompiler_Oracle.prototype.dropColumn = function() {
  var columns = helpers.normalizeArr.apply(null, arguments);
  this.pushQuery('alter table ' + this.tableName() + ' drop (' + this.formatter.columnize(columns) + ')');
};

TableCompiler_Oracle.prototype.changeType = function() {
  // alter table + table + ' modify ' + wrapped + '// type';
};

TableCompiler_Oracle.prototype._indexCommand = function(type, tableName, columns) {
  return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
};

TableCompiler_Oracle.prototype.primary = function(columns) {
  this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
};

TableCompiler_Oracle.prototype.dropPrimary = function() {
  this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
};

TableCompiler_Oracle.prototype.index = function(columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() +
    ' (' + this.formatter.columnize(columns) + ')');
};

TableCompiler_Oracle.prototype.dropIndex = function(columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('drop index ' + indexName);
};

TableCompiler_Oracle.prototype.unique = function(columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName +
    ' unique (' + this.formatter.columnize(columns) + ')');
};

TableCompiler_Oracle.prototype.dropUnique = function(columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
};

TableCompiler_Oracle.prototype.dropForeign = function(columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
};

client.TableBuilder = TableBuilder_Oracle;
client.TableCompiler = TableCompiler_Oracle;

};
