'use strict';

// MySQL Table Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');
var helpers  = require('../../../helpers');

// Table Builder
// ------

function TableBuilder_MySQL() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_MySQL, Schema.TableBuilder);

// Table Compiler
// ------

function TableCompiler_MySQL() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MySQL, Schema.TableCompiler);

TableCompiler_MySQL.prototype.createQuery = function(columns, ifNot) {
  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
  var conn = {}, sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

  // Check if the connection settings are set.
  if (client.connectionSettings) {
    conn = client.connectionSettings;
  }

  var charset   = this.single.charset || conn.charset || '';
  var collation = this.single.collate || conn.collate || '';
  var engine    = this.single.engine  || '';

  // var conn = builder.client.connectionSettings;
  if (charset)   sql += ' default character set ' + charset;
  if (collation) sql += ' collate ' + collation;
  if (engine)    sql += ' engine = ' + engine;

  if (this.single.comment) {
    var comment = (this.single.comment || '');
    if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    sql += " comment = '" + comment + "'";
  }

  this.pushQuery(sql);
};

TableCompiler_MySQL.prototype.addColumnsPrefix = 'add ';
TableCompiler_MySQL.prototype.dropColumnPrefix = 'drop ';

// Compiles the comment on the table.
TableCompiler_MySQL.prototype.comment = function(comment) {
  this.pushQuery('alter table ' + this.tableName() + " comment = '" + comment + "'");
};

TableCompiler_MySQL.prototype.changeType = function() {
  // alter table + table + ' modify ' + wrapped + '// type';
};

// Renames a column on the table.
TableCompiler_MySQL.prototype.renameColumn = function(from, to) {
  var table   = this.tableName();
  var wrapped = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);
  this.pushQuery({
    sql: 'show fields from ' + table + ' where field = ' +
      this.formatter.parameter(from),
    output: function(resp) {
      var column = resp[0];
      return this.query({
        sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
      });
    }
  });
};

TableCompiler_MySQL.prototype.index = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add index " + indexName + "(" + this.formatter.columnize(columns) + ")");
};

TableCompiler_MySQL.prototype.primary = function(columns, indexName) {
  indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add primary key " + indexName + "(" + this.formatter.columnize(columns) + ")");
};

TableCompiler_MySQL.prototype.unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add unique " + indexName + "(" + this.formatter.columnize(columns) + ")");
};

// Compile a drop index command.
TableCompiler_MySQL.prototype.dropIndex = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
};

// Compile a drop foreign key command.
TableCompiler_MySQL.prototype.dropForeign = function(columns, indexName) {
  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
};

// Compile a drop primary key command.
TableCompiler_MySQL.prototype.dropPrimary = function() {
  this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
};

// Compile a drop unique key command.
TableCompiler_MySQL.prototype.dropUnique = function(column, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
};

client.TableBuilder = TableBuilder_MySQL;
client.TableCompiler = TableCompiler_MySQL;

};
