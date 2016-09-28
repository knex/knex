'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// PostgreSQL Schema Compiler
// -------


function SchemaCompiler_PG() {
  _compiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(SchemaCompiler_PG, _compiler2.default);

// Check whether the current table
SchemaCompiler_PG.prototype.hasTable = function (tableName) {
  var sql = 'select * from information_schema.tables where table_name = ?';
  var bindings = [tableName];

  if (this.schema) {
    sql += ' and table_schema = ?';
    bindings.push(this.schema);
  } else {
    sql += ' and table_schema = current_schema()';
  }

  this.pushQuery({
    sql: sql,
    bindings: bindings,
    output: function output(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_PG.prototype.hasColumn = function (tableName, columnName) {
  var sql = 'select * from information_schema.columns where table_name = ? and column_name = ?';
  var bindings = [tableName, columnName];

  if (this.schema) {
    sql += ' and table_schema = ?';
    bindings.push(this.schema);
  } else {
    sql += ' and table_schema = current_schema()';
  }

  this.pushQuery({
    sql: sql,
    bindings: bindings,
    output: function output(resp) {
      return resp.rows.length > 0;
    }
  });
};

SchemaCompiler_PG.prototype.qualifiedTableName = function (tableName) {
  var name = this.schema ? this.schema + '.' + tableName : tableName;
  return this.formatter.wrap(name);
};

// Compile a rename table command.
SchemaCompiler_PG.prototype.renameTable = function (from, to) {
  this.pushQuery('alter table ' + this.qualifiedTableName(from) + ' rename to ' + this.formatter.wrap(to));
};

SchemaCompiler_PG.prototype.createSchema = function (schemaName) {
  this.pushQuery('create schema ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_PG.prototype.createSchemaIfNotExists = function (schemaName) {
  this.pushQuery('create schema if not exists ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_PG.prototype.dropSchema = function (schemaName) {
  this.pushQuery('drop schema ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_PG.prototype.dropSchemaIfExists = function (schemaName) {
  this.pushQuery('drop schema if exists ' + this.formatter.wrap(schemaName));
};

SchemaCompiler_PG.prototype.dropExtension = function (extensionName) {
  this.pushQuery('drop extension ' + this.formatter.wrap(extensionName));
};

SchemaCompiler_PG.prototype.dropExtensionIfExists = function (extensionName) {
  this.pushQuery('drop extension if exists ' + this.formatter.wrap(extensionName));
};

SchemaCompiler_PG.prototype.createExtension = function (extensionName) {
  this.pushQuery('create extension ' + this.formatter.wrap(extensionName));
};

SchemaCompiler_PG.prototype.createExtensionIfNotExists = function (extensionName) {
  this.pushQuery('create extension if not exists ' + this.formatter.wrap(extensionName));
};

exports.default = SchemaCompiler_PG;
module.exports = exports['default'];