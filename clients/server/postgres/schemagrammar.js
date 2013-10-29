// PostgreSQL SchemaGrammar
// -------
var _                 = require('underscore');
var grammar           = require('./grammar').grammar;
var baseSchemaGrammar = require('../../base/schemagrammar').baseSchemaGrammar;

// Grammar for the schema builder.
exports.schemaGrammar = _.defaults({

  // The possible column modifiers.
  modifiers: ['Increment', 'Nullable', 'Default'],

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, resp) {
    resp = resp[0];
    if (builder.type === 'tableExists' || builder.type === 'columnExists') {
      return resp.rows.length > 0;
    }
    return resp;
  },

  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return 'select * from information_schema.tables where table_name = ?';
  },

  // Compile the query to determine if a column exists in a table.
  compileColumnExists: function() {
    return 'select * from information_schema.columns where table_name = ? and column_name = ?';
  },

  // Compile a create table command.
  compileAdd: function(builder) {
    var table = this.wrapTable(builder);
    var columns = this.prefixArray('add column', this.getColumns(builder));
    return 'alter table ' + table + ' ' + columns.join(', ');
  },

  // Compile a primary key command.
  compilePrimary: function(builder, command) {
    var columns = this.columnize(command.columns);
    return 'alter table ' + this.wrapTable(builder) + " add primary key (" + columns + ")";
  },

  // Compile a unique key command.
  compileUnique: function(builder, command) {
    var table = this.wrapTable(builder);
    var columns = this.columnize(command.columns);
    return 'alter table ' + table + ' add constraint ' + command.index + ' unique (' + columns + ')';
  },

  // Compile a plain index key command.
  compileIndex: function(builder, command) {
    var columns = this.columnize(command.columns);
    return "create index " + command.index + " on " + this.wrapTable(builder) + ' (' + columns + ')';
  },

  // Compile a drop column command.
  compileDropColumn: function(builder, command) {
    var columns = this.prefixArray('drop column', this.wrapArray(command.columns));
    var table   = this.wrapTable(builder);
    return 'alter table ' + table + ' ' + columns.join(', ');
  },

  // Compile a drop primary key command.
  compileDropPrimary: function(builder) {
    var table = builder.getTable();
    return 'alter table ' + this.wrapTable(builder) + " drop constraint " + table + "_pkey";
  },

  // Compile a drop unique key command.
  compileDropUnique: function(builder, command) {
    var table = this.wrapTable(builder);
    return "alter table " + table + " drop constraint " + command.index;
  },

  // Compile a drop foreign key command.
  compileDropForeign: function(builder, command) {
    var table = this.wrapTable(builder);
    return "alter table " + table + " drop constraint " + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(builder, command) {
    return 'alter table ' + this.wrapTable(builder) + ' rename to ' + this.wrapTable(command.to);
  },

  // Compile a rename column command.
  compileRenameColumn: function(builder, command) {
    return 'alter table ' + this.wrapTable(builder) + ' rename '+ this.wrapTable(command.from) + ' to ' + this.wrapTable(command.to);
  },

  // Compile a comment command.
  compileComment: function(builder, command) {
    var sql = '';
    if (command.comment) {
      sql += 'comment on table ' + this.wrapTable(builder) + ' is ' + "'" + command.comment + "'";
    }
    return sql;
  },

  // Compile any additional postgres specific items.
  compileAdditional: function(builder, command) {
    return _.compact(_.map(builder.columns, function(column) {
      if (column.isCommented && _.isString(column.isCommented)) {
        return 'comment on column ' + this.wrapTable(builder) + '.' + this.wrap(column.name) + " is '" + column.isCommented + "'";
      }
    }, this));
  },

  // Create the column definition for a integer type.
  typeInteger: function(column) {
    return column.autoIncrement ? 'serial' : 'integer';
  },

  // Create the column definition for a tiny integer type.
  typeTinyInteger: function() {
    return 'smallint';
  },

  // Create the column definition for a float type.
  typeFloat: function() {
    return 'real';
  },

  // Create the column definition for a decimal type.
  typeDecimal: function(column) {
    return "decimal(" + column.precision + ", " + column.scale + ")";
  },

  // Create the column definition for a boolean type.
  typeBoolean: function() {
    return 'boolean';
  },

  // Create the column definition for an enum type.
  // Using method 2 here: http://stackoverflow.com/questions/10923213/postgres-enum-data-type-or-check-constraint
  typeEnum: function(column) {
    return 'text check(' + this.wrap(column.name) + " in('" + column.allowed.join("', '")  + "'))";
  },

  // Create the column definition for a date-time type.
  typeDateTime: function() {
    return 'timestamp';
  },

  // Create the column definition for a timestamp type.
  typeTimestamp: function() {
    return 'timestamp';
  },

  // Create the column definition for a bit type.
  typeBit: function(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  // Create the column definition for a binary type.
  typeBinary: function() {
    return 'bytea';
  },

  // Create the column definition for a uuid type.
  typeUuid: function() {
    return 'uuid';
  },

  // Create the column definition for a json type,
  // checking whether the json type is supported - falling
  // back to "text" if it's not.
  typeJson: function(column, builder) {
    if (parseFloat(builder.client.version) >= 9.2) return 'json';
    return 'text';
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(builder, column) {
    if (column.autoIncrement && (column.type == 'integer' || column.type == 'bigInteger')) {
      return ' primary key not null';
    }
  }

}, baseSchemaGrammar, grammar);
