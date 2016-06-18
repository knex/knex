
// Firebird Schema Compiler
// -------
'use strict';

var inherits = require('inherits');
var SchemaCompiler = require('../../../schema/compiler');
var assign = require('lodash/object/assign');

function SchemaCompiler_Firebird(client, builder) {
  SchemaCompiler.call(this, client, builder);
}
inherits(SchemaCompiler_Firebird, SchemaCompiler);

assign(SchemaCompiler_Firebird.prototype, {

  dropTablePrefix: 'DROP TABLE ',
  dropTableIfExists: function dropTableIfExists(tableName) {
    var queryDrop = 'execute block ' + 'as ' + 'begin ' + '    if (exists(select 1 from RDB$RELATION_FIELDS where RDB$SYSTEM_FLAG=0 AND RDB$RELATION_NAME = UPPER(\'' + tableName + '\'))) then ' + '        execute statement \'drop table ' + tableName + '\' ' + '        WITH AUTONOMOUS TRANSACTION; ' + 'end; ';

    this.pushQuery(queryDrop);
  },
  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
  },

  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    this.pushQuery({
      sql: 'show tables like ' + this.formatter.parameter(tableName),
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: "SELECT  TRIM(R.RDB$RELATION_NAME) AS RELATION_NAME, \n\
           TRIM(R.RDB$FIELD_NAME) AS FIELD_NAME \n\
              FROM RDB$RELATION_FIELDS R WHERE TRIM(R.RDB$RELATION_NAME) LIKE '" + this.formatter.wrap(tableName) + "' and TRIM(R.RDB$FIELD_NAME) like '" + this.formatter.parameter(column) + "'",
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  }

});

module.exports = SchemaCompiler_Firebird;