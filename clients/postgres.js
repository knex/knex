
var pg = require('pg');

var _ = require('underscore');
var util = require('util');
var genericPool = require('generic-pool');

var init, debug, pool, connection, connectionSettings;

// Initializes the postgres module with an options hash,
// containing the connection settings, as well as the
// pool config settings
exports.initialize = function (options) {

  // If there isn't a connection setting
  if (!options.connection) return;

  connectionSettings = options.connection;
  debug = options.debug;

  // If pooling is disabled, set the query getter to
  // something below and create a connection on the connection object
  if (options.pool === false) {
    pool = false;
    connection = this.getConnection();
    return;
  }

  // Extend the genericPool with the options
  // passed into the init under the "pool" option
  pool = genericPool.Pool(_.extend({
    name : 'postgres',
    create : function(callback) {
      callback(null, exports.getConnection());
    },
    destroy  : function(client) {
      client.end();
    },
    max : 10,
    min : 2,
    idleTimeoutMillis: 30000,
    log : false
  }, options.pool));
};

// Execute a query on the database.
// If the fourth parameter is set, this will be used as the connection
// to the database.
exports.query = function (querystring, params, callback, connection) {

  // If there is a connection, use it.
  if (connection) {
    return connection.query(querystring, params, callback);
  }

  // Acquire connection - callback function is called
  // once a resource becomes available.
  pool.acquire(function(err, client) {

    if (err) throw new Error(err);

    // Call the querystring and then release the client
    client.query(querystring, params, function () {
      pool.release(client);
      callback.apply(this, arguments);
    });

  });
};

// TODO: Return table prefix.
exports.getTablePrefix = function () {};

// Returns a pg connection, with a __cid property uniquely
// identifying the connection.
exports.getConnection = function () {
  var connection = new pg.Client(connectionSettings);
      connection.connect();
      connection.__cid = _.uniqueId('__cid');
  return connection;
};

// Extends the standard sql grammar.
var grammar = exports.grammar = {

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? util.format('"%s"', value) : "*");
  },

  compileInsertGetId: function(qb, values, sequence) {
    if (!sequence) sequence = 'id';
    return this.compileInsert(qb, values) + ' returning ' + this.wrap(sequence);
  },

  compileTruncate: function (qb) {
    var query = {};
    query['truncate ' + this.wrapTable(qb.from) + ' restart identity'] = [];
    return query;
  }
};

// Grammar for the schema builder.
exports.schemaGrammar = _.extend({}, grammar, {

  // The possible column modifiers.
  modifiers: ['Increment', 'Nullable', 'Default'],

  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return 'select * from information_schema.tables where table_name = ?';
  },

  // Compile a create table command.
  compileCreate: function(blueprint, command) {
    var columns = this.getColumns(blueprint).join(', ');
    return 'create table ' + this.wrapTable(blueprint) + " (" + columns + ")";
  },

  // Compile a create table command.
  compileAdd: function(blueprint, command) {
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
    return 'alter table table add constraint ' + command.index + ' unique (' + columns + ')';
  },

  // Compile a plain index key command.
  compileIndex: function(blueprint, command) {
    var columns = this.columnize(command.columns);
    return "create index " + command.index + " on " + this.wrapTable(blueprint) + ' (' + columns + ')';
  },

  // Compile a drop table command.
  compileDrop: function(blueprint, command) {
    return 'drop table ' + this.wrapTable(blueprint);
  },

  // Compile a drop table (if exists) command.
  compileDropIfExists: function(blueprint, command) {
    return 'drop table if exists ' + this.wrapTable(blueprint);
  },

  // Compile a drop column command.
  compileDropColumn: function(blueprint, command) {
    var columns = this.prefixArray('drop column', this.wrapArray(command.columns));
    table = this.wrapTable(blueprint);
    return 'alter table ' + table + ' ' + columns.join(', ');
  },

  // Compile a drop primary key command.
  compileDropPrimary: function(blueprint, command) {
    var table = blueprint.getTable();
    return 'alter table ' + this.wrapTable(blueprint) + " drop constraint " + table + "_pkey";
  },

  // Compile a drop unique key command.
  compileDropUnique: function(blueprint, command) {
    var table = this.wrapTable(blueprint);
    return "alter table " + table + " drop constraint " + command.index;
  },

  // Compile a drop index command.
  compileDropIndex: function(blueprint, command) {
    return "drop index " + command.index;
  },

  // Compile a drop foreign key command.
  compileDropForeign: function(blueprint, command) {
    var table = this.wrapTable(blueprint);
    return "alter table " + table + " drop constraint " + command.index;
  },

  // Compile a rename table command.
  compileRename: function(blueprint, command) {
    var from = this.wrapTable(blueprint);
    return "alter table " + from + " rename to " + this.wrapTable(command.to);
  },

  // Create the column definition for a string type.
  typeString: function(column) {
    return "varchar(" + column.length + ")";
  },

  // Create the column definition for a text type.
  typeText: function(column) {
    return 'text';
  },

  // Create the column definition for a integer type.
  typeInteger: function(column) {
    return column.autoIncrement ? 'serial' : 'integer';
  },

  // Create the column definition for a tiny integer type.
  typeTinyInteger: function(column) {
    return 'smallint';
  },

  // Create the column definition for a float type.
  typeFloat: function(column) {
    return 'real';
  },

  // Create the column definition for a decimal type.
  typeDecimal: function(column) {
    return "decimal(" + column.total + ", " + column.places + ")";
  },

  // Create the column definition for a boolean type.
  typeBoolean: function(column) {
    return 'boolean';
  },

  // Create the column definition for an enum type.
  typeEnum: function(column) {
    return 'varchar(255)';
  },

  // Create the column definition for a date type.
  typeDate: function(column) {
    return 'date';
  },

  // Create the column definition for a date-time type.
  typeDateTime: function(column) {
    return 'timestamp';
  },

  // Create the column definition for a time type.
  typeTime: function(column) {
    return 'time';
  },

  // Create the column definition for a timestamp type.
  typeTimestamp: function(column) {
    return 'timestamp';
  },

  // Create the column definition for a binary type.
  typeBinary: function(column) {
    return 'bytea';
  },

  // Get the SQL for a nullable column modifier.
  modifyNullable: function(blueprint, column) {
    return column.nullable ? ' null' : ' not null';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    if (column.defaultValue) {
      return " default " + this.getDefaultValue(column.defaultValue);
    }
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.type == 'integer' && column.autoIncrement) {
      return ' primary key';
    }
  }
});