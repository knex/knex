var When        = require('when');
var _           = require('underscore');
var util        = require('util');
var base        = require('./base');
var pg          = require('pg');

// Constructor for the PostgresClient
var PostgresClient = module.exports = function(name, options) {
  base.setup.call(this, PostgresClient, name, options);
};

_.extend(PostgresClient.prototype, base.protoProps, {

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    var emptyConnection = !builder._connection;
    var debug = this.debug || builder._debug;
    var instance = this;
    return When((builder._connection || this.getConnection()))
      .then(function(conn) {
        var dfd = When.defer();

        // Bind all of the ? to numbered vars.
        var questionCount = 0;
        builder.sql = builder.sql.replace(/\?/g, function() {
          questionCount++;
          return '$' + questionCount;
        });

        // If we have a debug flag set, console.log the query.
        if (debug) base.debug(builder, conn);

        // Call the querystring and then release the client
        conn.query(builder.sql, builder.bindings, function (err, resp) {
          if (err) return dfd.reject(err);
          resp || (resp = {});

          if (builder._source === 'Raw') return dfd.resolve(resp);

          if (builder._source === 'SchemaBuilder') {
            if (builder.type === 'tableExists') {
              if (resp.rows.length > 0) return dfd.resolve(resp.rows[0]);
              return dfd.reject(new Error('Table does not exist:' + builder.sql));
            } else {
              return dfd.resolve(null);
            }
          }

          if (resp.command === 'SELECT') {
            resp = resp.rows;
          } else if (resp.command === 'INSERT') {
            resp = _.map(resp.rows, function(row) { return row[builder._idAttribute]; });
          } else if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
            resp = resp.rowCount;
          } else {
            resp = '';
          }
          dfd.resolve(resp);
        });

        // Empty the connection after we run the query, unless one was specifically
        // set (in the case of transactions, etc).
        return dfd.promise.ensure(function() {
          if (emptyConnection) instance.pool.release(conn);
        });
      });
  },

  // Returns a connection from the `pg` lib.
  getRawConnection: function(callback) {
    var conn = new pg.Client(this.connectionSettings);
    conn.connect(function(err) {
      callback(err, conn);
    });
  }

});

// Extends the standard sql grammar.
PostgresClient.grammar = {

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? util.format('"%s"', value) : "*");
  },

  compileTruncate: function(qb) {
    return 'truncate ' + this.wrapTable(qb.table) + ' restart identity';
  },

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  compileInsert: function(qb) {
    var sql = require('../knex').Grammar.compileInsert.call(this, qb);
    if (qb._idAttribute) {
      sql += ' returning "' + qb._idAttribute + '"';
    }
    return sql;
  }

};

// Grammar for the schema builder.
PostgresClient.schemaGrammar = _.extend({}, base.schemaGrammar, PostgresClient.grammar, {

  // The possible column modifiers.
  modifiers: ['Increment', 'Nullable', 'Default'],

  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return 'select * from information_schema.tables where table_name = ?';
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

  // Create the column definition for a string type.
  typeString: function(column) {
    return "varchar(" + column.length + ")";
  },

  // Create the column definition for a text type.
  typeText: function() {
    return 'text';
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
  typeEnum: function(column) {
    return "enum('" + column.allowed.join("', '")  + "')";
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

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.type == 'integer' && column.autoIncrement) {
      return ' primary key';
    }
  }
});