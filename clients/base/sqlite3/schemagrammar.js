// SQLite3 SchemaGrammar
// -------
(function(define) {

"use strict";

define(function(require, exports) {

  var _                 = require('underscore');
  var grammar           = require('./grammar').grammar;
  var baseSchemaGrammar = require('../schemagrammar').baseSchemaGrammar;

  // Grammar for the schema builder.
  exports.schemaGrammar = _.defaults({

    // The possible column modifiers.
    modifiers: ['Nullable', 'Default', 'Increment'],

    // Returns the cleaned bindings for the current query.
    getBindings: function(builder) {
      if (builder.type === 'columnExists') return [];
      return grammar.getBindings(builder);
    },

    // Compile the query to determine if a table exists.
    compileTableExists: function() {
      return "select * from sqlite_master where type = 'table' and name = ?";
    },

    // Compile the query to determine if a column exists.
    compileColumnExists: function(builder) {
      return "PRAGMA table_info(" + this.wrapTable(builder) + ")";
    },

    // Compile a create table command.
    compileCreateTable: function(builder) {
      var columns = this.getColumns(builder).join(', ');
      var sql = 'create table ' + this.wrapTable(builder) + ' (' + columns;

      // SQLite forces primary keys to be added when the table is initially created
      // so we will need to check for a primary key commands and add the columns
      // to the table's declaration here so they can be created on the tables.
      sql += this.addForeignKeys(builder);
      sql += this.addPrimaryKeys(builder) || '';
      sql +=')';

      return sql;
    },

    // Get the foreign key syntax for a table creation statement.
    // Once we have all the foreign key commands for the table creation statement
    // we'll loop through each of them and add them to the create table SQL we
    // are building, since SQLite needs foreign keys on the tables creation.
    addForeignKeys: function(builder) {
      var sql = '';
      var commands = this.getCommandsByName(builder, 'foreign');
      for (var i = 0, l = commands.length; i < l; i++) {
        var command = commands[i];
        var column = this.columnize(command.columns);
        var foreignTable = this.wrapTable(command.foreignTable);
        var foreignColumn = this.columnize([command.foreignColumn]);
        sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + foreignColumn + ')';
      }
      return sql;
    },

    // Get the primary key syntax for a table creation statement.
    addPrimaryKeys: function(builder) {
      var primary = this.getCommandByName(builder, 'primary');
      if (primary) {
        // Ensure that autoincrement columns aren't handled here, this is handled
        // alongside the autoincrement clause.
        primary.columns = _.reduce(primary.columns, function(memo, column) {
          if (column.autoIncrement !== true) memo.push(column);
          return memo;
        }, []);
        if (primary.columns.length > 0) {
          var columns = this.columnize(primary.columns);
          return ', primary key (' + columns + ')';
        }
      }
    },

    // Compile alter table commands for adding columns
    compileAdd: function(builder) {
      var table = this.wrapTable(builder);
      var columns = this.prefixArray('add column', this.getColumns(builder));
      var statements = [];
      for (var i = 0, l = columns.length; i < l; i++) {
        statements.push('alter table ' + table + ' ' + columns[i]);
      }
      return statements;
    },

    // Compile a unique key command.
    compileUnique: function(builder, command) {
      var columns = this.columnize(command.columns);
      var table = this.wrapTable(builder);
      return 'create unique index ' + command.index + ' on ' + table + ' (' + columns + ')';
    },

    // Compile a plain index key command.
    compileIndex: function(builder, command) {
      var columns = this.columnize(command.columns);
      var table = this.wrapTable(builder);
      return 'create index ' + command.index + ' on ' + table + ' (' + columns + ')';
    },

    // Compile a foreign key command.
    compileForeign: function() {
      // Handled on table creation...
    },

    // Compile a drop column command.
    compileDropColumn: function() {
      throw new Error("Drop column not supported for SQLite.");
    },

    // Compile a drop unique key command.
    compileDropUnique: function(builder, command) {
      return 'drop index ' + command.index;
    },

    // Compile a rename table command.
    compileRenameTable: function(builder, command) {
      return 'alter table ' + this.wrapTable(builder) + ' rename to ' + this.wrapTable(command.to);
    },

    // Compile a rename column command.
    compileRenameColumn: function(builder, command) {
      return '__rename_column__';
    },

    // Create the column definition for a integer type.
    typeInteger: function() {
      return 'integer';
    },

    // Create the column definition for a float type.
    typeFloat: function() {
      return 'float';
    },

    // Create the column definition for a decimal type.
    typeDecimal: function() {
      return 'float';
    },

    // Create the column definition for a boolean type.
    typeBoolean: function() {
      return 'tinyint';
    },

    // Create the column definition for a enum type.
    typeEnum: function() {
      return 'varchar';
    },

    // Create the column definition for a date-time type.
    typeDateTime: function() {
      return 'datetime';
    },

    // Create the column definition for a timestamp type.
    typeTimestamp: function() {
      return 'datetime';
    },

    // Get the SQL for an auto-increment column modifier.
    modifyIncrement: function(builder, column) {
      if (column.autoIncrement && (column.type == 'integer' || column.type == 'bigInteger')) {
        return ' primary key autoincrement not null';
      }
    }
  }, baseSchemaGrammar, grammar);

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);