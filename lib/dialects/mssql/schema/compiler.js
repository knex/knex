
// MySQL Schema Compiler
// -------
'use strict';

var inherits = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');
var assign = require('lodash/object/assign');

function SchemaCompiler_MSSQL(client, builder) {
  SchemaCompiler.call(this, client, builder);
}
inherits(SchemaCompiler_MSSQL, SchemaCompiler);

assign(SchemaCompiler_MSSQL.prototype, {

  dropTablePrefix: 'DROP TABLE ',
  dropTableIfExists: function dropTableIfExists(tableName) {
    var name = this.formatter.wrap(prefixedTableName(this.schema, tableName));
    this.pushQuery('if object_id(\'' + name + '\', \'U\') is not null DROP TABLE ' + name);
  },

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('exec sp_rename ' + this.formatter.parameter(tableName) + ', ' + this.formatter.parameter(to));
  },

  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    this.pushQuery({
      sql: 'select object_id from sys.tables where object_id = object_id(' + this.formatter.parameter(this.formatter.wrap(tableName)) + ')',
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: 'select object_id from sys.columns where name = ' + this.formatter.parameter(column) + ' and object_id = object_id(' + this.formatter.parameter(this.formatter.wrap(tableName)) + ')',
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  }

});

function prefixedTableName(prefix, table) {
  return prefix ? prefix + '.' + table : table;
}

module.exports = SchemaCompiler_MSSQL;