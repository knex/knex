
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

  poolDefaults: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    destroy: function(client) {
      client.end();
    }
  },

  // Returns a mysql connection, with a __cid property uniquely
  // identifying the connection.
  getConnection: function() {
    var connection = new pg.Client(this.connectionSettings);
        connection.connect();
        connection.__cid = _.uniqueId('__cid');
    return connection;
  },

  // Execute a query on the database.
  // If the fourth parameter is set, this will be used as the connection
  // to the database.
  query: function (data, connection) {

    var dfd = Q.defer();

    if (this.debug) {
      if (connection) data.__cid = connection.__cid;
      console.log(data);
    }

    // Bind all of the ? to numbered vars.
    var questionCount = 0;
    querystring = querystring.replace(/\?/g, function () {
      questionCount++;
      return '$' + questionCount;
    });

    // If a `connection` is specified, use it, otherwise
    // Acquire a connection - and resolve the deferred
    // once a resource becomes available. If the connection
    // is from the pool, release the connection back to the pool
    // once the query completes.
    if (connection) {
      connection.query(data.sql, (data.bindings || []), function(err, res) {
        if (err) return dfd.reject(err);
        res || (res = {});
        if (res.command === 'INSERT' || res.command === 'UPDATE') {
          _.extend(res, {insertId: res.oid});
          dfd.resolve(res);
        } else {
          dfd.resolve(res.rows);
        }
      });
    } else {
      var instance = this;
      this.pool.acquire(function(err, client) {
        if (err) return dfd.reject(err);
        client.query(data.sql, (data.bindings || []), function (err, res) {
          instance.pool.release(client);
          if (err) return dfd.reject(err);
          res || (res = {});
          if (res.command === 'INSERT' || res.command === 'UPDATE') {
            _.extend(res, {insertId: res.oid});
            dfd.resolve(res);
          } else {
            dfd.resolve(res.rows);
          }
        });
      });
    }

    return dfd.promise;
  }
});

// Extends the standard sql grammar.
PostgresClient.grammar = {

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? util.format('"%s"', value) : "*");
  },

  compileTruncate: function (qb) {
    var query = {};
    query['truncate ' + this.wrapTable(qb.from) + ' restart identity'] = [];
    return query;
  }
};

// Grammar for the schema builder.
PostgresClient.schemaGrammar = _.extend({}, PostgresClient.grammar, {

  // The possible column modifiers.
  modifiers: ['Increment', 'Nullable', 'Default'],

  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return 'select * from information_schema.tables where table_name = ?';
  },

  // Compile a create table command.
  compileCreateTable: function(blueprint, command) {
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
  compileDropTable: function(blueprint, command) {
    return 'drop table ' + this.wrapTable(blueprint);
  },

  // Compile a drop table (if exists) command.
  compileDropTableIfExists: function(blueprint, command) {
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