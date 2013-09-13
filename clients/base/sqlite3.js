(function(define) {

"use strict";

define(function(require, exports) {

  var _           = require('underscore');
  var sqlite3     = require('sqlite3');

  var Grammar       = require('./grammar').Grammar;
  var SchemaGrammar = require('./schemagrammar').SchemaGrammar;

  var Client  = require('./client').Client;
  var Helpers = require('../../lib/helpers').Helpers;

  var Sqlite3 = Client.extend({

  });

  // Extends the standard sql grammar.
  Sqlite3.grammar = _.defaults({

    // The keyword identifier wrapper format.
    wrapValue: function(value) {
      return (value !== '*' ? Helpers.format('"%s"', value) : "*");
    },

    // Compile the "order by" portions of the query.
    compileOrders: function(qb, orders) {
      if (orders.length === 0) return;
      return "order by " + orders.map(function(order) {
        return this.wrap(order.column) + " collate nocase " + order.direction;
      }, this).join(', ');
    },

    // Compile an insert statement into SQL.
    compileInsert: function(qb) {
      var values = qb.values;
      var table = this.wrapTable(qb.table);
      var columns = _.pluck(values[0], 0);

      // If there are any "where" clauses, we need to omit
      // any bindings that may have been associated with them.
      if (qb.wheres.length > 0) this._clearWhereBindings(qb);

      // If there is only one record being inserted, we will just use the usual query
      // grammar insert builder because no special syntax is needed for the single
      // row inserts in SQLite. However, if there are multiples, we'll continue.
      if (values.length === 1) {
        var sql = 'insert into ' + table + ' ';
        if (columns.length === 0) {
          sql += 'default values';
        } else {
          sql += "(" + this.columnize(columns) + ") values " + "(" + this.parameterize(_.pluck(values[0], 1)) + ")";
        }
        return sql;
      }

      var blocks = [];

      // SQLite requires us to build the multi-row insert as a listing of select with
      // unions joining them together. So we'll build out this list of columns and
      // then join them all together with select unions to complete the queries.
      for (var i = 0, l = columns.length; i < l; i++) {
        blocks.push('? as ' + this.wrap(columns[i]));
      }

      var joinedColumns = blocks.join(', ');
      blocks = [];
      for (i = 0, l = values.length; i < l; i++) {
        blocks.push(joinedColumns);
      }

      return "insert into " + table + " (" + this.columnize(columns) + ") select " + blocks.join(' union all select ');
    },

    // Compile a truncate table statement into SQL.
    compileTruncate: function (qb) {
      var sql = [];
      var table = this.wrapTable(qb.table);
      sql.push('delete from sqlite_sequence where name = ' + table);
      sql.push('delete from ' + table);
      return sql;
    }

  }, Grammar);

  // Grammar for the schema builder.
  Sqlite3.schemaGrammar = _.defaults({

    // The possible column modifiers.
    modifiers: ['Nullable', 'Default', 'Increment'],

    // Compile the query to determine if a table exists.
    compileTableExists: function() {
      return "select * from sqlite_master where type = 'table' and name = ?";
    },

    // Compile the query to determine if a column exists.
    compileColumnExists: function(blueprint) {
      blueprint.bindings = [];
      return "PRAGMA table_info(" + this.wrapTable(blueprint) + ")";
    },

    // Compile a create table command.
    compileCreateTable: function(blueprint) {
      var columns = this.getColumns(blueprint).join(', ');
      var sql = 'create table ' + this.wrapTable(blueprint) + ' (' + columns;

      // SQLite forces primary keys to be added when the table is initially created
      // so we will need to check for a primary key commands and add the columns
      // to the table's declaration here so they can be created on the tables.
      sql += this.addForeignKeys(blueprint);
      sql += this.addPrimaryKeys(blueprint) || '';
      sql +=')';

      return sql;
    },

    // Get the foreign key syntax for a table creation statement.
    // Once we have all the foreign key commands for the table creation statement
    // we'll loop through each of them and add them to the create table SQL we
    // are building, since SQLite needs foreign keys on the tables creation.
    addForeignKeys: function(blueprint) {
      var sql = '';
      var commands = this.getCommandsByName(blueprint, 'foreign');
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
    addPrimaryKeys: function(blueprint) {
      var primary = this.getCommandByName(blueprint, 'primary');
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
    compileAdd: function(blueprint) {
      var table = this.wrapTable(blueprint);
      var columns = this.prefixArray('add column', this.getColumns(blueprint));
      var statements = [];
      for (var i = 0, l = columns.length; i < l; i++) {
        statements.push('alter table ' + table + ' ' + columns[i]);
      }
      return statements;
    },

    // Compile a unique key command.
    compileUnique: function(blueprint, command) {
      var columns = this.columnize(command.columns);
      var table = this.wrapTable(blueprint);
      return 'create unique index ' + command.index + ' on ' + table + ' (' + columns + ')';
    },

    // Compile a plain index key command.
    compileIndex: function(blueprint, command) {
      var columns = this.columnize(command.columns);
      var table = this.wrapTable(blueprint);
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
    compileDropUnique: function(blueprint, command) {
      return 'drop index ' + command.index;
    },

    // Compile a rename table command.
    compileRenameTable: function(blueprint, command) {
      return 'alter table ' + this.wrapTable(blueprint) + ' rename to ' + this.wrapTable(command.to);
    },

    // Compile a rename column command.
    compileRenameColumn: function(blueprint, command) {
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
    modifyIncrement: function(blueprint, column) {
      if ((column.type == 'integer' || column.type == 'bigInteger') && column.autoIncrement) {
        return ' primary key autoincrement not null';
      }
    }
  }, SchemaGrammar, Sqlite3.grammar);

  exports.Sqlite3 = Sqlite3;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);