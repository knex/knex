// MySQL SchemaGrammar
// -------
var _                 = require('lodash');
var grammar           = require('./grammar').grammar;
var baseSchemaGrammar = require('../../base/schemagrammar').baseSchemaGrammar;

// Grammar for the schema builder.
exports.schemaGrammar = _.defaults({

  // The possible column modifiers.
  modifiers: ['Unsigned', 'Nullable', 'Default', 'Increment', 'After', 'Comment'],

  // Dialect specific `getBindings`.
  getBindings: function(builder) {
    var bindings = grammar.getBindings(builder);
    if (builder.type === 'tableExists') {
      bindings.unshift(builder.client.connectionSettings.database);
    }
    if (builder.type === 'columnExists') bindings.shift();
    return bindings;
  },

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, resp) {
    resp = resp[0];
    if (builder.type === 'tableExists') return resp[0].length > 0;
    if (builder.type === 'columnExists') return resp[0].length > 0;
    return resp;
  },

  // Compile a create table command.
  compileCreateTable: function(builder, command) {
    var sql  = baseSchemaGrammar.compileCreateTable.call(this, builder, command);
    var conn = builder.client.connectionSettings;

    if (builder.flags.charset || conn.charset) sql += ' default character set ' + (builder.flags.charset || conn.charset);
    if (builder.flags.collation || conn.collation) sql += ' collate ' + (builder.flags.collation || conn.collation);
    if (builder.flags.engine) {
      sql += ' engine = ' + builder.flags.engine;
    }

    // Checks if the table is commented
    var isCommented = this.getCommandByName(builder, 'comment');

    // TODO: Handle max comment length.
    var maxTableCommentLength = 60;
    if (isCommented) {
      sql += " comment = '" + isCommented.comment + "'";
    }

    return sql;
  },

  // Compile the query to determine if a table exists.
  compileTableExists: function(builder) {
    return 'select * from information_schema.tables where table_schema = ? and table_name = ?';
  },

  // Compile a query to determine if a column exists.
  compileColumnExists: function(builder) {
    return 'show columns from ' + this.wrapTable(builder) + ' like ?';
  },

  // Compile an add command.
  compileAdd: function(builder) {
    var columns = this.prefixArray('add', this.getColumns(builder));
    return 'alter table ' + this.wrapTable(builder) + ' ' + columns.join(', ');
  },

  // Compile a primary key command.
  compilePrimary: function(builder, command) {
    return this.compileKey(builder, command, 'primary key');
  },

  // Compile a unique key command.
  compileUnique: function(builder, command) {
    return this.compileKey(builder, command, 'unique');
  },

  // Compile a plain index key command.
  compileIndex: function(builder, command) {
    return this.compileKey(builder, command, 'index');
  },

  // Compile an index creation command.
  compileKey: function(builder, command, type) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(builder);
    return 'alter table ' + table + " add " + type + " " + command.index + "(" + columns + ")";
  },

  // Compile a drop column command.
  compileDropColumn: function(builder, command) {
    var columns = this.prefixArray('drop', this.wrapArray(command.columns));
    return 'alter table ' + this.wrapTable(builder) + ' ' + columns.join(', ');
  },

  // Compile a drop primary key command.
  compileDropPrimary: function(builder) {
    return 'alter table ' + this.wrapTable(builder) + ' drop primary key';
  },

  // Compile a drop unique key command.
  compileDropUnique: function(builder, command) {
    return this.compileDropIndex(builder, command);
  },

  // Compile a drop index command.
  compileDropIndex: function(builder, command) {
    return 'alter table ' + this.wrapTable(builder) + ' drop index ' + command.index;
  },

  // Compile a drop foreign key command.
  compileDropForeign: function(builder, command) {
    return 'alter table ' + this.wrapTable(builder) + " drop foreign key " + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(builder, command) {
    return 'rename table ' + this.wrapTable(builder) + ' to ' + this.wrapTable(command.to);
  },

  // Compile a rename column command.
  compileRenameColumn: function(builder, command) {
    return 'alter table ' + this.wrapTable(builder) + ' change ' +
      this.wrapTable(command.from) + ' ' + this.wrapTable(command.to) + ' __datatype__';
  },

  // Compiles the comment on the table.
  compileComment: function(builder, command) {
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
    return 'float(' + column.precision + ',' + column.scale + ')';
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
  modifyUnsigned: function(builder, column) {
    if (column.isUnsigned) return ' unsigned';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(builder, column) {
    // TODO - no default on blob/text
    if (column.defaultValue != void 0 && column.type != 'blob' && column.type.indexOf('text') === -1) {
      return " default " + this.getDefaultValue(column.defaultValue);
    }
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(builder, column) {
    if (column.autoIncrement && (column.type == 'integer' || column.type == 'bigInteger')) {
      return ' not null auto_increment primary key';
    }
  },

  // Get the SQL for an "after" column modifier.
  modifyAfter: function(builder, column) {
    if (column.isAfter) {
      return ' after ' + this.wrap(column.isAfter);
    }
  },

  // Get the SQL for a comment column modifier.
  modifyComment: function(builder, column) {
    // TODO: Look into limiting this length.
    var maxColumnCommentLength = 255;
    if (column.isCommented && _.isString(column.isCommented)) {
      return " comment '" + column.isCommented + "'";
    }
  }

}, baseSchemaGrammar, grammar);