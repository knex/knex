
// Sqlanywhere Schema Compiler
// -------
var inherits       = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');

function SchemaCompiler_Sqlanywhere() {
  SchemaCompiler.apply(this, arguments);
}
inherits(SchemaCompiler_Sqlanywhere, SchemaCompiler);

// Rename a table on the schema.
SchemaCompiler_Sqlanywhere.prototype.renameTable = function(tableName, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(tableName) + ' rename ' + this.formatter.wrap(to));
};

// Check whether a table exists on the query.
SchemaCompiler_Sqlanywhere.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select TABLE_NAME from SYS.SYSTABLE where TABLE_NAME = ' +
      this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

// Check whether a column exists on the schema.
SchemaCompiler_Sqlanywhere.prototype.hasColumn = function(tableName, column) {
  this.pushQuery({
    sql: 'select COLUMN_NAME from SYS.SYSTABCOL C join SYS.SYSTAB T on C.TABLE_ID = T.TABLE_ID where TABLE_NAME = ' + this.formatter.parameter(tableName) +
      ' and COLUMN_NAME = ' + this.formatter.parameter(column),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

SchemaCompiler_Sqlanywhere.prototype.dropTable = function (tableName) {
  this.pushQuery('drop table ' + this.formatter.wrap(tableName));
};

SchemaCompiler_Sqlanywhere.prototype.dropTableIfExists = function(tableName) {
  this.pushQuery('drop table if exists ' + this.formatter.wrap(tableName));
};

module.exports = SchemaCompiler_Sqlanywhere;
