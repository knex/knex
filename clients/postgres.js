var Q           = require('q');
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
    var debug = this.debug || builder.debug;
    var instance = this;
    return Q((builder._connection || this.getConnection()))
      .then(function(conn) {
        var dfd = Q.defer();

        // Bind all of the ? to numbered vars.
        var questionCount = 0;
        builder.sql = builder.sql.replace(/\?/g, function() {
          questionCount++;
          return '$' + questionCount;
        });
        
        // If we have a debug flag set, console.log the query.
        if (debug) console.log(_.extend(builder, {__cid: conn.__cid}));

        // Call the querystring and then release the client
        conn.query(builder.sql, builder.bindings, function (err, resp) {
          if (err) return dfd.reject(err);
          resp || (resp = {});
          if (resp.command === 'INSERT' || resp.command === 'UPDATE') {
            debugger;
            _.extend(resp, {insertId: resp.oid});
          }

          dfd.resolve(resp);
        });

        // Empty the connection after we run the query, unless one was specifically
        // set (in the case of transactions, etc).
        return dfd.promise.fin(function() {
          if (emptyConnection) instance.pool.release(conn);
        });
      });
  },

  // Returns a connection from the `pg` lib.
  getRawConnection: function() {
    var conn = new pg.Client(this.connectionSettings);
        conn.connect();
    return conn;
  }

});

// Extends the standard sql grammar.
PostgresClient.grammar = {

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? util.format('"%s"', value) : "*");
  },

  compileTruncate: function(qb) {
    var query = {};
    query['truncate ' + this.wrapTable(qb.from) + ' restart identity'] = [];
    return query;
  },

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  compileInsert: function(qb) {
    var sql = require('../knex').Grammar.compileInsert.call(this, qb);
    if (qb.idAttr) {
      sql += ' returning ?';
      qb.bindings.push(qb.idAttr);
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
  compileRenameTable: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' rename to ' + this.wrapTable(command.to);
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
    return "enum('" + column.allowed.join("', '")  + "')";
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

  // Create the column definition for a bit type.
  typeBit: function(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  // Create the column definition for a binary type.
  typeBinary: function(column) {
    return 'bytea';
  },

  // Get the SQL for a nullable column modifier.
  modifyNullable: function(blueprint, column) {
    return column.isNullable ? ' null' : ' not null';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    if (column.defaultValue) {
      return " default '" + this.getDefaultValue(column.defaultValue) + "'";
    }
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.type == 'integer' && column.autoIncrement) {
      return ' primary key';
    }
  }
});