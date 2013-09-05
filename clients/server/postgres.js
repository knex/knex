var when = require('when');
var _    = require('underscore');
var util = require('util');
var base = require('./base');
var pg   = require('pg');

var Grammar = require('../base/grammar').Grammar;
var SchemaGrammar = require('../base/schemagrammar').SchemaGrammar;

// Constructor for the PostgresClient
var PostgresClient = module.exports = function(name, options) {
  base.setup.call(this, PostgresClient, name, options);
  this.dialect = 'postgresql';
};

_.extend(PostgresClient.prototype, base.protoProps, {

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    var emptyConnection = !builder._connection;
    var debug = this.debug || builder._debug;
    var instance = this;

    return when((builder._connection || this.getConnection()))
      .then(function(conn) {
        var dfd = when.defer();

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
            if (builder.type === 'tableExists' || builder.type === 'columnExists') {
              return dfd.resolve(resp.rows.length > 0);
            } else {
              return dfd.resolve(null);
            }
          }

          if (resp.command === 'SELECT') {
            resp = resp.rows;
          } else if (resp.command === 'INSERT') {
            resp = _.map(resp.rows, function(row) { return row[builder.isReturning]; });
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
    var instance = this;
    var connection = new pg.Client(this.connectionSettings);
    connection.connect(function(err) {
      if (!instance.version && !err) {
        return instance.checkVersion.call(instance, connection, callback);
      }
      callback(err, connection);
    });
  },

  // Check Version
  checkVersion: function(connection, callback) {
    var instance = this;
    connection.query('select version();', function(err, resp) {
      if (err) return callback(err);
      instance.version = /^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1];
      callback(null, connection);
    });
  }

});

// Extends the standard sql grammar.
PostgresClient.grammar = _.defaults({

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
    var values      = qb.values;
    var columns     = _.pluck(values[0], 0);
    var paramBlocks = [];

    // If there are any "where" clauses, we need to omit
    // any bindings that may have been associated with them.
    if (qb.wheres.length > 0) this._clearWhereBindings(qb);

    var sql = 'insert into ' + this.wrapTable(qb.table) + ' ';

    if (columns.length === 0) {
      sql += 'default values';
    } else {
      for (var i = 0, l = values.length; i < l; ++i) {
        paramBlocks.push("(" + this.parameterize(_.pluck(values[i], 1)) + ")");
      }
      sql += "(" + this.columnize(columns) + ") values " + paramBlocks.join(', ');
    }

    if (qb.isReturning) {
      sql += ' returning "' + qb.isReturning + '"';
    }
    return sql;
  }

}, Grammar);

// Grammar for the schema builder.
PostgresClient.schemaGrammar = _.defaults({

  // The possible column modifiers.
  modifiers: ['Increment', 'Nullable', 'Default'],

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
    if (parseFloat(blueprint.client.version) >= 9.2) {
      return 'json';
    }
    return 'text';
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if ((column.type == 'integer' || column.type == 'bigInteger') && column.autoIncrement) {
      return ' primary key not null';
    }
  }

}, SchemaGrammar, PostgresClient.grammar);
