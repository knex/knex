
// MySQL Schema Compiler
// -------
var inherits       = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');
var assign         = require('lodash/object/assign');

function SchemaCompiler_MySQL(client, builder) {
  SchemaCompiler.call(this, client, builder)
}
inherits(SchemaCompiler_MySQL, SchemaCompiler)

assign(SchemaCompiler_MySQL.prototype, {

  // Rename a table on the schema.
  renameTable: function(tableName, to) {
    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
  },

  // Check whether a table exists on the query.
  hasTable: function(tableName) {
    this.pushQuery({
      sql: 'show tables like ' + this.formatter.parameter(tableName),
      output: function(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function(tableName, column) {
    this.pushQuery({
      sql: 'show columns from ' + this.formatter.wrap(tableName) +
        ' like ' + this.formatter.parameter(column),
      output: function(resp) {
        return resp.length > 0;
      }
    });
  }

})

module.exports = SchemaCompiler_MySQL;
