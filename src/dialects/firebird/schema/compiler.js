
// Firebird Schema Compiler
// -------
var inherits       = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');
var assign         = require('lodash/object/assign');

function SchemaCompiler_Firebird(client, builder) {
  SchemaCompiler.call(this, client, builder)
}
inherits(SchemaCompiler_Firebird, SchemaCompiler)

assign(SchemaCompiler_Firebird.prototype, {
   
  
  dropTablePrefix: 'DROP TABLE ',
  dropTableIfExists: function(tableName) {
    var queryDrop = 'execute block ' +
                    'as ' +
                    'begin ' +
                    '    if (exists(select 1 from RDB$RELATION_FIELDS where RDB$SYSTEM_FLAG=0 AND RDB$RELATION_NAME = UPPER(\'' + tableName + '\'))) then ' +
                    '        execute statement \'drop table ' + tableName + '\' ' +
                    '        WITH AUTONOMOUS TRANSACTION; ' + 
                    'end; ';
     
    this.pushQuery(queryDrop);
  },
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

module.exports = SchemaCompiler_Firebird;
