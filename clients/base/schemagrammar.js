(function(define) {

"use strict";

define(function(require, exports) {

  var _             = require('underscore');
  var BaseGrammar   = require('./grammar').Grammar;
  var SchemaBuilder = require('../../lib/schemabuilder').SchemaBuilder;

  var Helpers = require('../../lib/helpers').Helpers;
  var Raw     = require('../../lib/raw').Raw;

  exports.SchemaGrammar = {

    // Compile a foreign key command.
    compileForeign: function(blueprint, command) {
      var sql;
      if (command.foreignTable && command.foreignColumn) {
        var table = this.wrapTable(blueprint);
        var column = this.columnize(command.columns);
        var foreignTable = this.wrapTable(command.foreignTable);
        var foreignColumn = this.columnize(command.foreignColumn);

        sql = "alter table " + table + " add constraint " + command.index + " ";
        sql += "foreign key (" + column + ") references " + foreignTable + " (" + foreignColumn + ")";

        // Once we have the basic foreign key creation statement constructed we can
        // build out the syntax for what should happen on an update or delete of
        // the affected columns, which will get something like "cascade", etc.
        if (command.commandOnDelete) sql += " on delete " + command.commandOnDelete;
        if (command.commandOnUpdate) sql += " on update " + command.commandOnUpdate;
      }
      return sql;
    },

    // Each of the column types have their own compiler functions which are
    // responsible for turning the column definition into its SQL format
    // for the platform. Then column modifiers are compiled and added.
    getColumns: function(blueprint) {
      var columns = [];
      for (var i = 0, l = blueprint.columns.length; i < l; i++) {
        var column = blueprint.columns[i];
        var sql = this.wrap(column) + ' ' + this.getType(column, blueprint);
        columns.push(this.addModifiers(sql, blueprint, column));
      }
      return columns;
    },

    // Add the column modifiers to the definition.
    addModifiers: function(sql, blueprint, column) {
      for (var i = 0, l = this.modifiers.length; i < l; i++) {
        var modifier = this.modifiers[i];
        var method = "modify" + modifier;
        if (_.has(this, method)) {
          sql += this[method](blueprint, column) || '';
        }
      }
      return sql;
    },

    // Get the SQL for the column data type.
    getType: function(column, blueprint) {
      return this['type' + Helpers.capitalize(column.type)](column, blueprint);
    },

    // Add a prefix to an array of values, utilized in the client libs.
    prefixArray: function(prefix, values) {
      return _.map(values, function(value) { return prefix + ' ' + value; });
    },

    // Wrap a table in keyword identifiers.
    wrapTable: function(table) {
      if (table instanceof SchemaBuilder) table = table.table;
      return BaseGrammar.wrapTable.call(this, table);
    },

    // Wrap a value in keyword identifiers.
    wrap: function(value) {
      if (value && value.name) value = value.name;
      return BaseGrammar.wrap.call(this, value);
    },

    // Format a value so that it can be used in "default" clauses.
    getDefaultValue: function(value) {
      if (value instanceof Raw) return value.sql;
      if (value === true || value === false) {
        return parseInt(value, 10);
      }
      return '' + value;
    },

    // Get the primary key command if it exists on the blueprint.
    getCommandByName: function(blueprint, name) {
      var commands = this.getCommandsByName(blueprint, name);
      if (commands.length > 0) return commands[0];
    },

    // Get all of the commands with a given name.
    getCommandsByName: function(blueprint, name) {
      return _.filter(blueprint.commands, function(value) { return value.name == name; }) || [];
    },

    // Used to compile any database specific items.
    compileAdditional: function() {},

    // Compile a create table command.
    compileCreateTable: function(blueprint) {
      var columns = this.getColumns(blueprint).join(', ');
      return 'create table ' + this.wrapTable(blueprint) + ' (' + columns + ')';
    },

    // Compile a drop table command.
    compileDropTable: function(blueprint) {
      return 'drop table ' + this.wrapTable(blueprint);
    },

    // Compile a drop table (if exists) command.
    compileDropTableIfExists: function(blueprint) {
      return 'drop table if exists ' + this.wrapTable(blueprint);
    },

    // Compile a drop index command.
    compileDropIndex: function(blueprint, command) {
      return 'drop index ' + command.index;
    },

    // Default for a biginteger type in database in other databases.
    typeBigInteger: function(column) {
      return this.typeInteger(column);
    },

    // Create the column definition for a string type.
    typeString: function(column) {
      return "varchar(" + column.length + ")";
    },

    // Create the column definition for a text type.
    typeText: function() {
      return 'text';
    },

    // Create the column definition for a tiny integer type.
    typeTinyInteger: function() {
      return 'tinyint';
    },

    // Create the column definition for a time type.
    typeTime: function() {
      return 'time';
    },

    // Create the column definition for a date type.
    typeDate: function() {
      return 'date';
    },

    // Create the column definition for a binary type.
    typeBinary: function() {
      return 'blob';
    },

    // Create the column definition for a json type.
    typeJson: function() {
      return 'text';
    },

    // Create the column definition for a uuid type.
    typeUuid: function() {
      return 'char(36)';
    },

    // Create a specific type
    typeSpecificType: function(column) {
      return column.specific;
    },

    // Get the SQL for a nullable column modifier.
    modifyNullable: function(blueprint, column) {
      if (column.isNullable === false) {
        return ' not null';
      }
    },

    // Get the SQL for a default column modifier.
    modifyDefault: function(blueprint, column) {
      if (column.defaultValue != void 0) {
        return " default '" + this.getDefaultValue(column.defaultValue) + "'";
      }
    }

  };

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);