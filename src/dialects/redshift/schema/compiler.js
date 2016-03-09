// Redshift Schema Compiler
// -------


var inherits       = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');

function SchemaCompiler_Redshift() {
  SchemaCompiler.apply(this, arguments);
}
inherits(SchemaCompiler_Redshift, SchemaCompiler);

// Check whether the current table
SchemaCompiler_Redshift.prototype.hasTable = function(tableName) {
  var sql = 'select * from information_schema.tables where table_name = ?';
  var bindings = [tableName];

  if (this.schema) {
    sql += ' and table_schema = ?';
    bindings.push(this.schema);
  } else {
    sql += ' and table_schema = current_schema';
  }

  this.pushQuery({
    sql: sql,
    bindings: bindings,
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_Redshift.prototype.hasColumn = function(tableName, columnName) {
  var sql = 'select * from information_schema.columns where table_name = ? and column_name = ?';
  var bindings = [tableName, columnName];

  if (this.schema) {
    sql += ' and table_schema = ?';
    bindings.push(this.schema);
  } else {
    sql += ' and table_schema = current_schema';
  }

  this.pushQuery({
    sql: sql,
    bindings: bindings,
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

SchemaCompiler_Redshift.prototype.qualifiedTableName = function(tableName) {
  var name = this.schema ? `${this.schema}.${tableName}` : tableName;
  return this.formatter.wrap(name);
};

// Compile a rename table command.
SchemaCompiler_Redshift.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.qualifiedTableName(from) + ' rename to ' + this.qualifiedTableName(to));
};

SchemaCompiler_Redshift.prototype.createSchema = function(schemaName) {
  this.pushQuery('create schema ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_Redshift.prototype.createSchemaIfNotExists = function(schemaName) {
  this.pushQuery('create schema if not exists ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_Redshift.prototype.dropSchema = function(schemaName) {
  this.pushQuery('drop schema ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_Redshift.prototype.dropSchemaIfExists = function(schemaName) {
  this.pushQuery('drop schema if exists ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_Redshift.prototype.dropExtension = function(extensionName) {
  this.pushQuery('drop extension ' + this.formatter.wrap(extensionName));
};

SchemaCompiler_Redshift.prototype.dropExtensionIfExists = function(extensionName) {
  this.pushQuery('drop extension if exists ' + this.formatter.wrap(extensionName));
};

SchemaCompiler_Redshift.prototype.createExtension = function(extensionName) {
  this.pushQuery('create extension ' + this.formatter.wrap(extensionName));
};

SchemaCompiler_Redshift.prototype.createExtensionIfNotExists = function(extensionName) {
  this.pushQuery('create extension if not exists ' + this.formatter.wrap(extensionName));
};

module.exports = SchemaCompiler_Redshift;
