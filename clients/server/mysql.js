// mysql
// -------

// All of the "when.js" promise components needed in this module.
var when     = require('when');
var nodefn   = require('when/node/function');
var sequence = require('when/sequence');

// Other dependencies, including the `mysql` library,
// which needs to be added as a dependency to the project
// using this database.
var _     = require('underscore');
var mysql = require('mysql');

// All other local project modules needed in this scope.
var ServerBase        = require('./base').ServerBase;
var baseGrammar       = require('../base/grammar').BaseGrammar;
var baseSchemaGrammar = require('../base/schemagrammar').BaseSchemaGrammar;
var Helpers           = require('../../lib/helpers').Helpers;

// Constructor for the MySQLClient.
exports.Client = ServerBase.extend({

  dialect: 'mysql',

  runQuery: function(connection, sql, bindings) {
    return nodefn.call(connection.query.bind(connection), sql, bindings);
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  getRawConnection: function() {
    var connection = mysql.createConnection(this.connectionSettings);
    return nodefn.call(connection.connect.bind(connection)).yield(connection);
  },

  // Used to check if there is a conditional query needed to complete the next one.
  checkSchema: function(builder) {
    return function(conn) {
      var sql = builder.sql;
      if (sql.indexOf('alter table') === 0 && sql.indexOf('__datatype__') === (sql.length - 12)) {
        var newSql = sql.replace('alter table', 'show fields from').split('change')[0] + ' where field = ?';
        return nodefn.call(conn.query.bind(conn), newSql, [builder.commands[builder.currentIndex].from]).then(function(resp) {
          var column = resp[0];
          // Set to the datatype we're looking to change it to...
          builder.sql = builder.sql.replace('__datatype__', column[0].Type);
        });
      }
    };
  }

});

// Extends the standard sql grammar.
var grammar = exports.grammar = _.defaults({

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? Helpers.format('`%s`', value) : "*");
  },

  // Parses the response, according to the way mySQL works...
  handleResponse: function(builder, response) {
    if (builder.type === 'select') response = Helpers.skim(response[0]);
    if (builder.type === 'insert') response = [response[0].insertId];
    if (builder.type === 'delete' || builder.type === 'update') response = response.affectedRows;
    return response;
  }

}, baseGrammar);

// Grammar for the schema builder.
var schemaGrammar = exports.schemaGrammar = _.defaults({

  // The possible column modifiers.
  modifiers: ['Unsigned', 'Nullable', 'Default', 'Increment', 'After', 'Comment'],

  // Handle response for the schema.
  handleResponse: function(builder, resp) {
    if (builder.type === 'tableExists') return resp.length > 0;
    if (builder.type === 'columnExists') return resp.length > 0;
    return null;
  },

  // Compile a create table command.
  compileCreateTable: function(blueprint, command) {
    var sql  = baseSchemaGrammar.compileCreateTable.call(this, blueprint, command);
    var conn = blueprint.client.connectionSettings;

    if (conn.charset) sql += ' default character set ' + conn.charset;
    if (conn.collation) sql += ' collate ' + conn.collation;
    if (blueprint.isEngine) {
      sql += ' engine = ' + blueprint.isEngine;
    }

    // Checks if the table is commented
    var isCommented = this.getCommandByName(blueprint, 'comment');

    // TODO: Handle max comment length.
    var maxTableCommentLength = 60;
    if (isCommented) {
      sql += " comment = '" + isCommented.comment + "'";
    }

    return sql;
  },

  // Compile the query to determine if a table exists.
  compileTableExists: function(blueprint) {
    blueprint.bindings.unshift(blueprint.client.connectionSettings.database);
    return 'select * from information_schema.tables where table_schema = ? and table_name = ?';
  },

  // Compile a query to determine if a column exists.
  compileColumnExists: function(blueprint) {
    return 'show columns from ' + this.wrapTable(blueprint) + ' like ?';
  },

  // Compile an add command.
  compileAdd: function(blueprint) {
    var columns = this.prefixArray('add', this.getColumns(blueprint));
    return 'alter table ' + this.wrapTable(blueprint) + ' ' + columns.join(', ');
  },

  // Compile a primary key command.
  compilePrimary: function(blueprint, command) {
    command.name = null;
    return this.compileKey(blueprint, command, 'primary key');
  },

  // Compile a unique key command.
  compileUnique: function(blueprint, command) {
    return this.compileKey(blueprint, command, 'unique');
  },

  // Compile a plain index key command.
  compileIndex: function(blueprint, command) {
    return this.compileKey(blueprint, command, 'index');
  },

  // Compile an index creation command.
  compileKey: function(blueprint, command, type) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(blueprint);
    return 'alter table ' + table + " add " + type + " " + command.index + "(" + columns + ")";
  },

  // Compile a drop column command.
  compileDropColumn: function(blueprint, command) {
    var columns = this.prefixArray('drop', this.wrapArray(command.columns));
    return 'alter table ' + this.wrapTable(blueprint) + ' ' + columns.join(', ');
  },

  // Compile a drop primary key command.
  compileDropPrimary: function(blueprint) {
    return 'alter table ' + this.wrapTable(blueprint) + ' drop primary key';
  },

  // Compile a drop unique key command.
  compileDropUnique: function(blueprint, command) {
    return this.compileDropIndex(blueprint, command);
  },

  // Compile a drop index command.
  compileDropIndex: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' drop index ' + command.index;
  },

  // Compile a drop foreign key command.
  compileDropForeign: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + " drop foreign key " + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(blueprint, command) {
    return 'rename table ' + this.wrapTable(blueprint) + ' to ' + this.wrapTable(command.to);
  },

  // Compile a rename column command.
  compileRenameColumn: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' change ' +
      this.wrapTable(command.from) + ' ' + this.wrapTable(command.to) + ' __datatype__';
  },

  // Compiles the comment on the table.
  compileComment: function(blueprint, command) {
    // Handled on create table...
  },

  // Create the column definition for a text type.
  typeText: function(column) {
    switch (column.length) {
      case 'medium':
      case 'mediumtext':
        return 'mediumtext';
      case 'long':
      case 'longtext':
        return 'longtext';
      default:
        return 'text';
    }
  },

  // Create the column type definition for a bigint type.
  typeBigInteger: function() {
    return 'bigint';
  },

  // Create the column definition for a integer type.
  typeInteger: function(column) {
    return 'int(' + column.length + ')';
  },

  // Create the column definition for a float type.
  typeFloat: function(column) {
    return 'float(' + column.total + ',' + column.places + ')';
  },

  // Create the column definition for a decimal type.
  typeDecimal: function(column) {
    return 'decimal(' + column.precision + ', ' + column.scale + ')';
  },

  // Create the column definition for a boolean type.
  typeBoolean: function() {
    return 'tinyint(1)';
  },

  // Create the column definition for a enum type.
  typeEnum: function(column) {
    return "enum('" + column.allowed.join("', '")  + "')";
  },

  // Create the column definition for a date-time type.
  typeDateTime: function() {
    return 'datetime';
  },

  // Create the column definition for a timestamp type.
  typeTimestamp: function() {
    return 'timestamp';
  },

  // Create the column definition for a bit type.
  typeBit: function(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  // Get the SQL for an unsigned column modifier.
  modifyUnsigned: function(blueprint, column) {
    if (column.isUnsigned) return ' unsigned';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    // TODO - no default on blob/text
    if (column.defaultValue != void 0 && column.type != 'blob' && column.type.indexOf('text') === -1) {
      return " default '" + this.getDefaultValue(column.defaultValue) + "'";
    }
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.autoIncrement && (column.type == 'integer' || column.type == 'bigInteger')) {
      return ' not null auto_increment primary key';
    }
  },

  // Get the SQL for an "after" column modifier.
  modifyAfter: function(blueprint, column) {
    if (column.isAfter) {
      return ' after ' + this.wrap(column.isAfter);
    }
  },

  // Get the SQL for a comment column modifier.
  modifyComment: function(blueprint, column) {
    // TODO: Look into limiting this length.
    var maxColumnCommentLength = 255;
    if (column.isCommented && _.isString(column.isCommented)) {
      return " comment '" + column.isCommented + "'";
    }
  }

}, baseSchemaGrammar, grammar);