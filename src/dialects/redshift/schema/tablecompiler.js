// Redshift Table Builder & Compiler
// -------

var _             = require('lodash');
var inherits      = require('inherits');
var TableCompiler = require('../../../schema/tablecompiler');

function TableCompiler_Redshift() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Redshift, TableCompiler);

// Compile a rename column command.
TableCompiler_Redshift.prototype.renameColumn = function(from, to) {
  return this.pushQuery({
    sql: 'alter table ' + this.tableName() + ' rename '+ this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
  });
};

TableCompiler_Redshift.prototype.compileAdd = function(builder) {
  var table = this.formatter.wrap(builder);
  var columns = this.prefixArray('add column', this.getColumns(builder));
  return this.pushQuery({
    sql: 'alter table ' + table + ' ' + columns.join(', ')
  });
};

// Adds the "create" query to the query sequence.
TableCompiler_Redshift.prototype.createQuery = function(columns, ifNot) {
  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
  this.pushQuery({
    sql: createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')',
    bindings: columns.bindings
  });
  var hasComment = _.has(this.single, 'comment');
  if (hasComment) this.comment(this.single.comment);
};

// Compiles the comment on the table.
TableCompiler_Redshift.prototype.comment = function(comment) {
  /*jshint unused: false*/
  this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (this.single.comment || '') + "'");
};

// Indexes:
// -------

// this should be noop
TableCompiler_Redshift.prototype.primary = function(columns) {
  this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
};
// this should be noop
TableCompiler_Redshift.prototype.unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName +
    ' unique (' + this.formatter.columnize(columns) + ')');
};
// this should be noop
TableCompiler_Redshift.prototype.index = function(columns, indexName, indexType) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + (indexType && (' using ' + indexType) || '') +
    ' (' + this.formatter.columnize(columns) + ')');
};
// this should be noop
TableCompiler_Redshift.prototype.dropPrimary = function() {
  let constraintName = this.formatter.wrap(this.tableNameRaw + '_pkey');
  this.pushQuery('alter table ' + this.tableName() + " drop constraint " + constraintName);
};
// this should be noop
TableCompiler_Redshift.prototype.dropIndex = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('drop index ' + indexName);
};
// this should be noop
TableCompiler_Redshift.prototype.dropUnique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
};
// this should be noop
TableCompiler_Redshift.prototype.dropForeign = function(columns, indexName) {
  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
};

module.exports = TableCompiler_Redshift;
