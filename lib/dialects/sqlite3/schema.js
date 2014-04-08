// SQLite3 SchemaGrammar
// -------
module.exports = function(client) {

var _              = require('lodash');
var inherits       = require('inherits');

var Promise        = require('../../promise');

var SchemaBuilder  = require('../../schema/builder');
var SchemaCompiler = require('../../schema/compiler');

var TableBuilder   = require('../../schema/tablebuilder');
var TableCompiler  = require('../../schema/tablecompiler');

var ColumnBuilder  = require('../../schema/columnbuilder');
var ColumnCompiler = require('../../schema/columncompiler');

function SchemaBuilder_SQLite3() {
  SchemaBuilder.apply(this, arguments);
}
inherits(SchemaBuilder_SQLite3, SchemaBuilder);


function SchemaCompiler_SQLite3() {
  this.Formatter = client.Formatter;
}
inherits(SchemaCompiler_SQLite3, SchemaBuilder);

// Compile the query to determine if a table exists.
SchemaCompiler_SQLite3.prototype.hasTable = function(tableName) {
  this.sequence.push({
    sql: "select * from sqlite_master where type = 'table' and name = ?",
    bindings: [tableName],
    output: function(resp) {
      return resp.length > 0;
    }
  });
  return this;
},

// Compile the query to determine if a column exists.
SchemaCompiler_SQLite3.prototype.hasColumn = function(tableName, column) {
  this.push({
    sql: 'PRAGMA table_info(' + this.formatter.wrap(tableName) + ')',
    output: function(resp) {
      return _.findWhere(resp, {name: column}) != null;
    }
  });
},

// Compile a rename table command.
SchemaCompiler_SQLite3.prototype.renameTable = function(from, to) {
  this.push('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

function TableBuilder_SQLite3() {
  TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_SQLite3, TableBuilder);

function TableCompiler_SQLite3() {
  this.modifierTypes = ['nullable', 'defaultTo'];
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_SQLite3, TableCompiler);

// All of the SQLite3 specific DDL helpers for renaming/dropping columns
// and changing datatypes.
var SQLite3_DDL = require('./ddl')(client);

// All modifiers for the sqlite3 builder.
TableCompiler_SQLite3.prototype.modifiers = require('./tablecompiler/modifiers')(client),

// All key related statements for the sqlite3 builder.
TableCompiler_SQLite3.prototype.keys = require('./tablecompiler/keys')(client),

// Create a new table.
TableCompiler_SQLite3.prototype.create = function() {
  var returnSql = this.returnSql = [];
  returnSql.push({sql: '', bindings: []});

  var sql = 'create table ' + this.tableName + ' (' + this.getColumns().join(', ');

  // SQLite forces primary keys to be added when the table is initially created
  // so we will need to check for a primary key commands and add the columns
  // to the table's declaration here so they can be created on the tables.
  sql += this.foreignKeys() || '';
  sql += this.primaryKeys() || '';

  returnSql[0].sql = sql + ')';

  this.alterColumns();
  this.addIndexes();
  return returnSql;
};

TableCompiler_SQLite3.prototype.alter = function() {
  var returnSql = this.returnSql = [];
  var columns = this.getColumns();
  for (var i = 0, l = columns.length; i < l; i++) {
    var column = columns[i];
    this.returnSql.push({sql: 'alter table ' + this.tableName + ' add column ' + column});
  }
  this.alterColumns();
  this.addIndexes();
  return returnSql;
};

TableCompiler_SQLite3.prototype.foreignKeys = function() {
  var sql = '';
  var foreignKeys = _.where(this.statements, {type: 'indexes', method: 'foreign'});
  for (var i = 0, l = foreignKeys.length; i < l; i++) {
    var foreign = foreignKeys[i].args[0];
    var column        = this.formatter.columnize(foreign.column);
    var references    = this.formatter.columnize(foreign.references);
    var foreignTable  = this.formatter.wrap(foreign.inTable);
    sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + references + ')';
  }
  return sql;
};

TableCompiler_SQLite3.prototype.primaryKeys = function() {
  var indexes = _.where(this.statements, {type: 'indexes', method: 'primary'});
  if (indexes.length > 0) {
    var primary = indexes[0];
    var columns = primary.args[0];
    if (columns) {
      return ', primary key (' + this.formatter.columnize(columns) + ')';
    }
  }
};

TableCompiler_SQLite3.prototype.createTableBlock = function() {
  return this.getColumns().concat().join(',');
};

// Compile a rename column command... very complex in sqlite
TableCompiler_SQLite3.prototype.renameColumn = function(from, to) {
  var tableCompiler = this;
  return {
    sql: 'PRAGMA table_info(' + this.tableName + ')',
    output: function(pragma) {
      return new SQLite3_DDL(this, tableCompiler, pragma)
        .renameColumn(from, to);
    }
  };
};

TableCompiler_SQLite3.prototype.dropColumn = function(column) {
  return {
    sql: 'PRAGMA table_info(' + this.tableName + ')',
    output: function(pragma) {
      return new SQLite3_DDL(this, tableCompiler, pragma)
        .dropColumn(column);
    }
  };
};

function ColumnBuilder_SQLite3() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_SQLite3, ColumnBuilder);

function ColumnCompiler_SQLite3() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnCompiler_SQLite3, ColumnCompiler);


ColumnCompiler_SQLite3.prototype.double =
ColumnCompiler_SQLite3.prototype.decimal =
ColumnCompiler_SQLite3.prototype.floating = 'float';

ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

// Handled on create table.
ColumnCompiler_SQLite3.prototype.primary =
ColumnCompiler_SQLite3.prototype.foreign = function() {};

// Compile a unique key command.
ColumnCompiler_SQLite3.prototype.unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  columns = this.formatter.columnize(columns);
  return {
    sql: 'create unique index ' + indexName + ' on ' + this.tableName + ' (' + columns + ')'
  };
};

// Compile a plain index key command.
ColumnCompiler_SQLite3.prototype.index = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  columns = this.formatter.columnize(columns);
  return {
    sql: 'create index ' + indexName + ' on ' + this.tableName + ' (' + columns + ')'
  };
};

// Compile a drop column command.
ColumnCompiler_SQLite3.prototype.dropColumn = function() {
  throw new Error("Drop column not supported for SQLite.");
};

// Compile a drop unique key command.
ColumnCompiler_SQLite3.prototype.dropUnique = function(value) {
  return 'drop index ' + value;
};

ColumnCompiler_SQLite3.prototype.dropIndex = function(index) {
  return 'drop index ' + index;
};

client.ColumnBuilder = ColumnBuilder_SQLite3;
client.ColumnCompiler = ColumnCompiler_SQLite3;

};