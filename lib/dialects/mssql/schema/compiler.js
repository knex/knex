
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

  dropTableIfExists: function dropTableIfExists(tableName) {
    var name = this.formatter.wrap(prefixedTableName(this.schema, tableName));
    this.pushQuery('if object_id(\'' + name + '\', \'U\') is not null drop table ' + name);
  },

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
  },

  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    this.pushQuery({
      sql: 'SELECT object_id FROM sys.tables WHERE object_id = Object_ID(N\'' + this.formatter.parameter(tableName) + '\')',
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: 'SELECT object_id FROM sys.columns WHERE Name Like ' + this.formatter.parameter(column) + ' AND object_id = Object_ID(N\'' + this.formatter.wrap(tableName) + '\')',
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