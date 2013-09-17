var grammar           = require('./grammar').grammar;
var baseSchemaGrammar = require('../../base/schemagrammar').baseSchemaGrammar;

// Grammar for the schema builder.
exports.schemaGrammar = _.defaults({

  // The possible column modifiers.
  modifiers: ['Increment', 'Nullable', 'Default'],

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
  compileAdd: function(blueprint) {
    var table = this.wrapTable(blueprint);
    var columns = this.prefixArray('add column', this.getColumns(blueprint));
    return 'alter table ' + table + ' ' + columns.join(', ');
  },

  // Compile a primary key command.
  compilePrimary: function(blueprint, command) {
    var columns = this.columnize(command.columns);
    return 'alter table ' + this.wrapTable(blueprint) + " add primary key (" + columns + ")";
  },

  // Compile a unique key command.
  compileUnique: function(blueprint, command) {
    var table = this.wrapTable(blueprint);
    var columns = this.columnize(command.columns);
    return 'alter table ' + table + ' add constraint ' + command.index + ' unique (' + columns + ')';
  },

  // Compile a plain index key command.
  compileIndex: function(blueprint, command) {
    var columns = this.columnize(command.columns);
    return "create index " + command.index + " on " + this.wrapTable(blueprint) + ' (' + columns + ')';
  },

  // Compile a drop column command.
  compileDropColumn: function(blueprint, command) {
    var columns = this.prefixArray('drop column', this.wrapArray(command.columns));
    var table   = this.wrapTable(blueprint);
    return 'alter table ' + table + ' ' + columns.join(', ');
  },

  // Compile a drop primary key command.
  compileDropPrimary: function(blueprint) {
    var table = blueprint.getTable();
    return 'alter table ' + this.wrapTable(blueprint) + " drop constraint " + table + "_pkey";
  },

  // Compile a drop unique key command.
  compileDropUnique: function(blueprint, command) {
    var table = this.wrapTable(blueprint);
    return "alter table " + table + " drop constraint " + command.index;
  },

  // Compile a drop foreign key command.
  compileDropForeign: function(blueprint, command) {
    var table = this.wrapTable(blueprint);
    return "alter table " + table + " drop constraint " + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' rename to ' + this.wrapTable(command.to);
  },

  // Compile a rename column command.
  compileRenameColumn: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' rename '+ this.wrapTable(command.from) + ' to ' + this.wrapTable(command.to);
  },

  // Compile a comment command.
  compileComment: function(blueprint, command) {
    var sql = '';
    if (command.comment) {
      sql += 'comment on table ' + this.wrapTable(blueprint) + ' is ' + "'" + command.comment + "'";
    }
    return sql;
  },

  // Compile any additional postgres specific items.
  compileAdditional: function(blueprint, command) {
    return _.compact(_.map(blueprint.columns, function(column) {
      if (column.isCommented && _.isString(column.isCommented)) {
        return 'comment on column ' + this.wrapTable(blueprint) + '.' + this.wrap(column.name) + " is '" + column.isCommented + "'";
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
    return "decimal(" + column.total + ", " + column.places + ")";
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
  typeJson: function(column, blueprint) {
    if (parseFloat(blueprint.client.version) >= 9.2) return 'json';
    return 'text';
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.autoIncrement && (column.type == 'integer' || column.type == 'bigInteger')) {
      return ' primary key not null';
    }
  }

}, baseSchemaGrammar, grammar);
